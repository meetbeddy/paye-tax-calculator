export interface TaxBracket {
	limit: number;
	rate: number;
}

export interface BracketBreakdown {
	range: string;
	rate: string;
	taxableAmount: number;
	tax: number;
}

export interface CalculationResult {
	monthlyPAYE: number;
	annualPAYE: number;
	effectiveTaxRate: number;
	taxableIncome: number;
	totalAllowances: number;
	bracketBreakdown: BracketBreakdown[];
	netMonthlyPay: number;
	netAnnualPay: number;
}

export interface Results {
	legacy: CalculationResult;
	reform: CalculationResult;
	savings: {
		monthly: number;
		annual: number;
		percentage: number;
	};
	monthlyGross: number;
}

export interface AdditionalDeductions {
	pension: string;
	nhf: string;
	insurance: string;
}

export interface Scenario {
	id: string;
	label: string;
	monthlyGross: number;
	results: Results;
}

export interface Employee {
	id: string;
	name: string;
	email: string;
	department: string;
	monthlyGross: number;
	additionalDeductions: AdditionalDeductions;
	results: Results;
}

export interface HistoryEntry {
	id: string;
	date: string;
	monthlyGross: number;
	results: Results;
	label?: string;
}
