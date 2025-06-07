import type {
	AdditionalDeductions,
	TaxBracket,
	BracketBreakdown,
	CalculationResult,
	Results,
} from "./types";
import { LEGACY_BRACKETS, REFORM_BRACKETS } from "./constants";

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
};

export const parseDeductions = (deductions: AdditionalDeductions) => {
	return {
		pension: parseFloat(deductions.pension) || 0,
		nhf: parseFloat(deductions.nhf) || 0,
		insurance: parseFloat(deductions.insurance) || 0,
	};
};

export const calculateAllowances = (
	annualGross: number,
	isReform: boolean,
	totalAdditionalDeductions: number
) => {
	const consolidatedReliefAllowance = Math.max(200_000, annualGross * 0.01);

	if (isReform) {
		return {
			totalAllowances: consolidatedReliefAllowance + totalAdditionalDeductions,
			taxableIncome: Math.max(
				0,
				annualGross - consolidatedReliefAllowance - totalAdditionalDeductions
			),
		};
	}

	const grossIncomeAllowance = annualGross * 0.2;
	const totalAllowances =
		consolidatedReliefAllowance +
		grossIncomeAllowance +
		totalAdditionalDeductions;

	return {
		totalAllowances,
		taxableIncome: Math.max(0, annualGross - totalAllowances),
	};
};

export const calculateTaxByBrackets = (
	taxableIncome: number,
	brackets: TaxBracket[]
) => {
	let tax = 0;
	let previousLimit = 0;
	const bracketBreakdown: BracketBreakdown[] = [];

	for (const bracket of brackets) {
		if (taxableIncome <= previousLimit) break;

		const taxableInBracket =
			Math.min(taxableIncome, bracket.limit) - previousLimit;
		const taxForBracket = taxableInBracket * bracket.rate;

		if (taxableInBracket > 0) {
			bracketBreakdown.push({
				range: `₦${previousLimit.toLocaleString()} - ${
					bracket.limit === Infinity
						? "Above"
						: "₦" + bracket.limit.toLocaleString()
				}`,
				rate: (bracket.rate * 100).toFixed(0) + "%",
				taxableAmount: taxableInBracket,
				tax: taxForBracket,
			});
		}

		tax += taxForBracket;
		previousLimit = bracket.limit;

		if (taxableIncome <= bracket.limit) break;
	}

	return { tax, bracketBreakdown };
};

export const calculatePAYE = (
	monthlyGross: number,
	brackets: TaxBracket[],
	isReform = false,
	additionalDeductions: AdditionalDeductions = {
		pension: "",
		nhf: "",
		insurance: "",
	}
): CalculationResult => {
	const annualGrossIncome = monthlyGross * 12;
	const deductions = parseDeductions(additionalDeductions);
	const totalAdditionalDeductions =
		(deductions.pension + deductions.nhf + deductions.insurance) * 12;

	const { totalAllowances, taxableIncome } = calculateAllowances(
		annualGrossIncome,
		isReform,
		totalAdditionalDeductions
	);
	const { tax, bracketBreakdown } = calculateTaxByBrackets(
		taxableIncome,
		brackets
	);

	const monthlyTax = tax / 12;
	const effectiveTaxRate =
		annualGrossIncome > 0 ? (tax / annualGrossIncome) * 100 : 0;
	const netMonthlyPay =
		monthlyGross -
		monthlyTax -
		deductions.pension -
		deductions.nhf -
		deductions.insurance;

	return {
		monthlyPAYE: Math.round(monthlyTax * 100) / 100,
		annualPAYE: Math.round(tax * 100) / 100,
		effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
		taxableIncome: Math.round(taxableIncome * 100) / 100,
		totalAllowances: Math.round(totalAllowances * 100) / 100,
		bracketBreakdown,
		netMonthlyPay: Math.round(netMonthlyPay * 100) / 100,
		netAnnualPay: Math.round(netMonthlyPay * 12 * 100) / 100,
	};
};

export const calculateResults = (
	monthlyAmount: number,
	additionalDeductions: AdditionalDeductions
): Results => {
	const legacyResult = calculatePAYE(
		monthlyAmount,
		LEGACY_BRACKETS,
		false,
		additionalDeductions
	);
	const reformResult = calculatePAYE(
		monthlyAmount,
		REFORM_BRACKETS,
		true,
		additionalDeductions
	);

	const monthlySavings = legacyResult.monthlyPAYE - reformResult.monthlyPAYE;
	const annualSavings = legacyResult.annualPAYE - reformResult.annualPAYE;
	const savingsPercentage =
		legacyResult.annualPAYE > 0
			? (annualSavings / legacyResult.annualPAYE) * 100
			: 0;

	return {
		legacy: legacyResult,
		reform: reformResult,
		savings: {
			monthly: monthlySavings,
			annual: annualSavings,
			percentage: savingsPercentage,
		},
		monthlyGross: monthlyAmount,
	};
};
