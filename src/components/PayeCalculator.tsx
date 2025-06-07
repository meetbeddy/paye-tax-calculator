import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calculator, TrendingDown, TrendingUp, FileText, Eye, EyeOff } from 'lucide-react';

// Legacy tax brackets (pre-2024 reform)
const legacyBrackets = [
    { limit: 300_000, rate: 0.07 },
    { limit: 600_000, rate: 0.11 },
    { limit: 1_100_000, rate: 0.15 },
    { limit: 1_600_000, rate: 0.19 },
    { limit: 3_200_000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 },
];

// New tax brackets (2024 reform)
const reformBrackets = [
    { limit: 800_000, rate: 0 },
    { limit: 3_000_000, rate: 0.15 },
    { limit: 12_000_000, rate: 0.18 },
    { limit: 25_000_000, rate: 0.21 },
    { limit: 50_000_000, rate: 0.23 },
    { limit: Infinity, rate: 0.25 },
];

interface BracketBreakdown {
    range: string;
    rate: string;
    taxableAmount: number;
    tax: number;
}

interface CalculationResult {
    monthlyPAYE: number;
    annualPAYE: number;
    effectiveTaxRate: number;
    taxableIncome: number;
    totalAllowances: number;
    bracketBreakdown: BracketBreakdown[];
    netMonthlyPay: number;
    netAnnualPay: number;
}

interface Results {
    legacy: CalculationResult;
    reform: CalculationResult;
    savings: {
        monthly: number;
        annual: number;
        percentage: number;
    };
    monthlyGross: number;
}

interface AdditionalDeductions {
    pension: string;
    nhf: string;
    insurance: string;
}

function calculatePAYE(monthlyGross: number, brackets: typeof legacyBrackets, isReform = false, additionalDeductions: AdditionalDeductions = { pension: '', nhf: '', insurance: '' }): CalculationResult {
    const annualGrossIncome = monthlyGross * 12;

    // Calculate standard allowances
    let consolidatedReliefAllowance: number;
    let taxableIncome: number;

    const pensionContribution = parseFloat(additionalDeductions.pension) || 0;
    const nhfContribution = parseFloat(additionalDeductions.nhf) || 0;
    const insurancePremium = parseFloat(additionalDeductions.insurance) || 0;

    const totalAdditionalDeductions = (pensionContribution + nhfContribution + insurancePremium) * 12;

    if (isReform) {
        consolidatedReliefAllowance = Math.max(200000, annualGrossIncome * 0.01);
        taxableIncome = Math.max(0, annualGrossIncome - consolidatedReliefAllowance - totalAdditionalDeductions);
    } else {
        consolidatedReliefAllowance = Math.max(200000, annualGrossIncome * 0.01);
        const grossIncomeAllowance = annualGrossIncome * 0.20;
        const totalAllowances = consolidatedReliefAllowance + grossIncomeAllowance + totalAdditionalDeductions;
        taxableIncome = Math.max(0, annualGrossIncome - totalAllowances);
    }

    // Calculate tax on taxable income using progressive brackets
    let tax = 0;
    let previousLimit = 0;
    const bracketBreakdown: BracketBreakdown[] = [];

    for (const bracket of brackets) {
        const { limit, rate } = bracket;

        if (taxableIncome <= previousLimit) {
            break;
        }

        const taxableInThisBracket = Math.min(taxableIncome, limit) - previousLimit;
        const taxForThisBracket = taxableInThisBracket * rate;

        if (taxableInThisBracket > 0) {
            bracketBreakdown.push({
                range: `₦${previousLimit.toLocaleString()} - ${limit === Infinity ? 'Above' : '₦' + limit.toLocaleString()}`,
                rate: (rate * 100).toFixed(0) + '%',
                taxableAmount: taxableInThisBracket,
                tax: taxForThisBracket,
            });
        }

        tax += taxForThisBracket;
        previousLimit = limit;

        if (taxableIncome <= limit) {
            break;
        }
    }

    const monthlyTax = tax / 12;
    const effectiveTaxRate = annualGrossIncome > 0 ? (tax / annualGrossIncome * 100) : 0;
    const netMonthlyPay = monthlyGross - monthlyTax - pensionContribution - nhfContribution - insurancePremium;

    return {
        monthlyPAYE: Math.round(monthlyTax * 100) / 100,
        annualPAYE: Math.round(tax * 100) / 100,
        effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
        taxableIncome: Math.round(taxableIncome * 100) / 100,
        totalAllowances: Math.round((annualGrossIncome - taxableIncome) * 100) / 100,
        bracketBreakdown,
        netMonthlyPay: Math.round(netMonthlyPay * 100) / 100,
        netAnnualPay: Math.round(netMonthlyPay * 12 * 100) / 100,
    };
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(amount);
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function PayeCalculator() {
    const [monthlyGross, setMonthlyGross] = useState<string>('');
    const [inputType, setInputType] = useState<'monthly' | 'annual'>('monthly');
    const [results, setResults] = useState<Results | null>(null);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
    const [additionalDeductions, setAdditionalDeductions] = useState<AdditionalDeductions>({
        pension: '',
        nhf: '',
        insurance: '',
    });

    const handleCalculate = () => {
        let monthlyAmount = parseFloat(monthlyGross);

        if (inputType === 'annual') {
            monthlyAmount = monthlyAmount / 12;
        }

        if (!isNaN(monthlyAmount) && monthlyAmount >= 0) {
            const legacyResult = calculatePAYE(monthlyAmount, legacyBrackets, false, additionalDeductions);
            const reformResult = calculatePAYE(monthlyAmount, reformBrackets, true, additionalDeductions);

            const monthlySavings = legacyResult.monthlyPAYE - reformResult.monthlyPAYE;
            const annualSavings = legacyResult.annualPAYE - reformResult.annualPAYE;
            const savingsPercentage = legacyResult.annualPAYE > 0 ? (annualSavings / legacyResult.annualPAYE) * 100 : 0;

            setResults({
                legacy: legacyResult,
                reform: reformResult,
                savings: {
                    monthly: monthlySavings,
                    annual: annualSavings,
                    percentage: savingsPercentage,
                },
                monthlyGross: monthlyAmount,
            });
        }
    };

    const handleClear = () => {
        setMonthlyGross('');
        setResults(null);
        setShowBreakdown(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Calculator className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            Nigerian PAYE Calculator
                        </h1>
                    </div>

                </div>

                {/* Input Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Salary Information
                    </h2>

                    <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Input Type
                            </label>
                            <select
                                value={inputType}
                                onChange={(e) => setInputType(e.target.value as 'monthly' | 'annual')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="monthly">Monthly Salary</option>
                                <option value="annual">Annual Salary</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {inputType === 'monthly' ? 'Monthly' : 'Annual'} Gross Salary
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₦</span>
                                <input
                                    type="number"
                                    placeholder={`Enter your ${inputType} gross salary`}
                                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    value={monthlyGross}
                                    onChange={(e) => setMonthlyGross(e.target.value)}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Monthly Deductions (Optional)</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pension Contribution
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₦</span>
                                    <input
                                        type="number"
                                        placeholder="8% of basic salary"
                                        className="w-full pl-7 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={additionalDeductions.pension}
                                        onChange={(e) => setAdditionalDeductions(prev => ({ ...prev, pension: e.target.value }))}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NHF Contribution
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₦</span>
                                    <input
                                        type="number"
                                        placeholder="2.5% of basic salary"
                                        className="w-full pl-7 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={additionalDeductions.nhf}
                                        onChange={(e) => setAdditionalDeductions(prev => ({ ...prev, nhf: e.target.value }))}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Life Insurance Premium
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₦</span>
                                    <input
                                        type="number"
                                        placeholder="Monthly premium"
                                        className="w-full pl-7 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={additionalDeductions.insurance}
                                        onChange={(e) => setAdditionalDeductions(prev => ({ ...prev, insurance: e.target.value }))}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleCalculate}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!monthlyGross}
                        >
                            Calculate Tax
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                        >
                            Clear
                        </button>
                        {results && (
                            <button
                                onClick={() => setShowBreakdown(!showBreakdown)}
                                className="flex items-center gap-2 px-6 py-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl font-medium transition-all duration-200"
                            >
                                {showBreakdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showBreakdown ? 'Hide' : 'Show'} Details
                            </button>
                        )}
                    </div>
                </div>

                {results && (
                    <>
                        {/* Results Comparison */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            {/* Legacy System */}
                            <div className="bg-white border-l-4 border-red-400 rounded-xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Legacy Tax System</h3>
                                        <p className="text-sm text-gray-600">Pre-2024 Reform</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Monthly PAYE:</span>
                                        <span className="font-semibold text-red-700 text-lg">
                                            {formatCurrency(results.legacy.monthlyPAYE)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Annual PAYE:</span>
                                        <span className="font-semibold text-red-700">
                                            {formatCurrency(results.legacy.annualPAYE)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Effective Rate:</span>
                                        <span className="font-semibold text-red-700">
                                            {results.legacy.effectiveTaxRate}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-red-50 rounded-lg px-3">
                                        <span className="text-gray-700 font-medium">Net Monthly Pay:</span>
                                        <span className="font-bold text-red-800 text-lg">
                                            {formatCurrency(results.legacy.netMonthlyPay)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reform System */}
                            <div className="bg-white border-l-4 border-green-400 rounded-xl shadow-lg p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <TrendingDown className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">2024 Tax Reform</h3>
                                        <p className="text-sm text-gray-600">Pending Presidential Assent</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Monthly PAYE:</span>
                                        <span className="font-semibold text-green-700 text-lg">
                                            {formatCurrency(results.reform.monthlyPAYE)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Annual PAYE:</span>
                                        <span className="font-semibold text-green-700">
                                            {formatCurrency(results.reform.annualPAYE)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-700">Effective Rate:</span>
                                        <span className="font-semibold text-green-700">
                                            {results.reform.effectiveTaxRate}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-green-50 rounded-lg px-3">
                                        <span className="text-gray-700 font-medium">Net Monthly Pay:</span>
                                        <span className="font-bold text-green-800 text-lg">
                                            {formatCurrency(results.reform.netMonthlyPay)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Savings Summary */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8">
                            <h3 className="text-xl font-semibold text-yellow-900 mb-4 text-center">
                                💰 Potential Tax Savings with 2024 Reform
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6 text-center">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Monthly Savings</p>
                                    <p className={`text-2xl font-bold ${results.savings.monthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {results.savings.monthly >= 0 ? '+' : ''}{formatCurrency(results.savings.monthly)}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Annual Savings</p>
                                    <p className={`text-2xl font-bold ${results.savings.annual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {results.savings.annual >= 0 ? '+' : ''}{formatCurrency(results.savings.annual)}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Percentage Reduction</p>
                                    <p className={`text-2xl font-bold ${results.savings.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {results.savings.percentage >= 0 ? '-' : '+'}{Math.abs(results.savings.percentage).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            {results.savings.monthly < 0 && (
                                <p className="text-sm text-red-600 mt-4 text-center bg-red-50 p-3 rounded-lg">
                                    ⚠️ The reform may result in higher taxes for your income level
                                </p>
                            )}
                        </div>

                        {/* Tax Brackets Comparison */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            {/* Legacy Brackets */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    Legacy Tax Brackets
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-2 font-medium">Annual Income Range</th>
                                                <th className="text-left py-3 px-2 font-medium">Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {legacyBrackets.map((bracket, index) => {
                                                const prevLimit = index === 0 ? 0 : legacyBrackets[index - 1].limit;
                                                const isInfinite = bracket.limit === Infinity;
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-2">
                                                            {formatCurrency(prevLimit)} - {isInfinite ? 'Above' : formatCurrency(bracket.limit)}
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                                {(bracket.rate * 100).toFixed(0)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Reform Brackets */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    2024 Reform Tax Brackets
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-2 font-medium">Annual Income Range</th>
                                                <th className="text-left py-3 px-2 font-medium">Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reformBrackets.map((bracket, index) => {
                                                const prevLimit = index === 0 ? 0 : reformBrackets[index - 1].limit;
                                                const isInfinite = bracket.limit === Infinity;
                                                return (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-2">
                                                            {formatCurrency(prevLimit)} - {isInfinite ? 'Above' : formatCurrency(bracket.limit)}
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${bracket.rate === 0
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {(bracket.rate * 100).toFixed(0)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        {showBreakdown && (
                            <>
                                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                    {/* Legacy Breakdown */}
                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Legacy System - Tax Calculation Breakdown
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-2 px-3">Income Range</th>
                                                        <th className="text-left py-2 px-3">Rate</th>
                                                        <th className="text-right py-2 px-3">Taxable Amount</th>
                                                        <th className="text-right py-2 px-3">Tax</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {results.legacy.bracketBreakdown.map((bracket, index) => (
                                                        <tr key={index} className="border-b border-gray-100">
                                                            <td className="py-2 px-3 text-xs">{bracket.range}</td>
                                                            <td className="py-2 px-3">{bracket.rate}</td>
                                                            <td className="py-2 px-3 text-right">{formatCurrency(bracket.taxableAmount)}</td>
                                                            <td className="py-2 px-3 text-right font-medium">{formatCurrency(bracket.tax)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Reform Breakdown */}
                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            2024 Reform - Tax Calculation Breakdown
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-2 px-3">Income Range</th>
                                                        <th className="text-left py-2 px-3">Rate</th>
                                                        <th className="text-right py-2 px-3">Taxable Amount</th>
                                                        <th className="text-right py-2 px-3">Tax</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {results.reform.bracketBreakdown.map((bracket, index) => (
                                                        <tr key={index} className="border-b border-gray-100">
                                                            <td className="py-2 px-3 text-xs">{bracket.range}</td>
                                                            <td className="py-2 px-3">{bracket.rate}</td>
                                                            <td className="py-2 px-3 text-right">{formatCurrency(bracket.taxableAmount)}</td>
                                                            <td className="py-2 px-3 text-right font-medium">{formatCurrency(bracket.tax)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Net Pay Comparison</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={[
                                                { name: 'Legacy System', tax: results.legacy.monthlyPAYE, net: results.legacy.netMonthlyPay },
                                                { name: '2024 Reform', tax: results.reform.monthlyPAYE, net: results.reform.netMonthlyPay }
                                            ]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                                <Legend />
                                                <Bar dataKey="tax" fill="#ef4444" name="Monthly Tax" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="net" fill="#10b981" name="Net Pay" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-lg p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income Breakdown (2024 Reform)</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Net Pay', value: results.reform.netMonthlyPay, fill: COLORS[0] },
                                                        { name: 'PAYE Tax', value: results.reform.monthlyPAYE, fill: COLORS[1] },
                                                        { name: 'Other Deductions', value: Math.max(0, results.monthlyGross - results.reform.netMonthlyPay - results.reform.monthlyPAYE), fill: COLORS[2] }
                                                    ].filter(item => item.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(1)}%`}
                                                    labelLine={false}
                                                >
                                                    {[
                                                        { name: 'Net Pay', value: results.reform.netMonthlyPay, fill: COLORS[0] },
                                                        { name: 'PAYE Tax', value: results.reform.monthlyPAYE, fill: COLORS[1] },
                                                        { name: 'Other Deductions', value: Math.max(0, results.monthlyGross - results.reform.netMonthlyPay - results.reform.monthlyPAYE), fill: COLORS[2] }
                                                    ].filter(item => item.value > 0).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Key Differences</h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-medium text-blue-800 mb-2">Legacy System</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• Minimum annual exemption: ₦300,000</li>
                                                <li>• Maximum tax rate: 24%</li>
                                                <li>• 20% gross income allowance</li>
                                                <li>• Higher tax burden on middle income</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-blue-800 mb-2">2024 Reform</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• Tax-free threshold: ₦800,000 annually</li>
                                                <li>• Maximum tax rate: 25%</li>
                                                <li>• Simplified allowance structure</li>
                                                <li>• Relief for low to middle income earners</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Footer */}
                <div className="text-center mt-12 text-sm text-gray-500">
                    <p>This calculator is for estimation purposes only. Actual tax calculations may vary based on specific circumstances.</p>
                    <p className="mt-1">The 2024 tax reform is pending presidential assent as of June 2025.</p>
                </div>
            </div>
        </div>
    );
}