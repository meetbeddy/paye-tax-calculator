import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calculator, TrendingDown, TrendingUp, FileText, Eye, EyeOff, Zap, X, Plus } from 'lucide-react';

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

interface Scenario {
    id: string;
    label: string;
    monthlyGross: number;
    results: Results;
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

function calculateResults(monthlyAmount: number, additionalDeductions: AdditionalDeductions): Results {
    const legacyResult = calculatePAYE(monthlyAmount, legacyBrackets, false, additionalDeductions);
    const reformResult = calculatePAYE(monthlyAmount, reformBrackets, true, additionalDeductions);

    const monthlySavings = legacyResult.monthlyPAYE - reformResult.monthlyPAYE;
    const annualSavings = legacyResult.annualPAYE - reformResult.annualPAYE;
    const savingsPercentage = legacyResult.annualPAYE > 0 ? (annualSavings / legacyResult.annualPAYE) * 100 : 0;

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
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function PayeCalculator() {
    const [monthlyGross, setMonthlyGross] = useState<string>('');
    const [inputType, setInputType] = useState<'monthly' | 'annual'>('monthly');
    const [results, setResults] = useState<Results | null>(null);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
    const [showScenarios, setShowScenarios] = useState<boolean>(false);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [customScenario, setCustomScenario] = useState({ label: '', amount: '', type: 'percentage' as 'percentage' | 'fixed' });
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
            const calculatedResults = calculateResults(monthlyAmount, additionalDeductions);
            setResults(calculatedResults);
        }
    };

    const handleClear = () => {
        setMonthlyGross('');
        setResults(null);
        setShowBreakdown(false);
        setShowScenarios(false);
        setScenarios([]);
    };

    const addQuickScenario = (label: string, changePercent: number, fixedAmount?: number) => {
        if (!results) return;

        let newMonthlyGross: number;
        if (fixedAmount) {
            newMonthlyGross = results.monthlyGross + fixedAmount;
        } else {
            newMonthlyGross = results.monthlyGross * (1 + changePercent / 100);
        }

        const scenarioResults = calculateResults(newMonthlyGross, additionalDeductions);
        const newScenario: Scenario = {
            id: Date.now().toString(),
            label,
            monthlyGross: newMonthlyGross,
            results: scenarioResults
        };

        setScenarios(prev => [...prev, newScenario]);
    };

    const addCustomScenario = () => {
        if (!results || !customScenario.label || !customScenario.amount) return;

        const amount = parseFloat(customScenario.amount);
        if (isNaN(amount)) return;

        let newMonthlyGross: number;
        if (customScenario.type === 'percentage') {
            newMonthlyGross = results.monthlyGross * (1 + amount / 100);
        } else {
            newMonthlyGross = results.monthlyGross + amount;
        }

        const scenarioResults = calculateResults(newMonthlyGross, additionalDeductions);
        const newScenario: Scenario = {
            id: Date.now().toString(),
            label: customScenario.label,
            monthlyGross: newMonthlyGross,
            results: scenarioResults
        };

        setScenarios(prev => [...prev, newScenario]);
        setCustomScenario({ label: '', amount: '', type: 'percentage' });
    };

    const removeScenario = (id: string) => {
        setScenarios(prev => prev.filter(s => s.id !== id));
    };

    const chartData = scenarios.length > 0 ? [
        {
            name: 'Current',
            legacyTax: results?.legacy.monthlyPAYE || 0,
            reformTax: results?.reform.monthlyPAYE || 0,
            netPay: results?.reform.netMonthlyPay || 0,
        },
        ...scenarios.map(scenario => ({
            name: scenario.label.length > 15 ? scenario.label.substring(0, 15) + '...' : scenario.label,
            legacyTax: scenario.results.legacy.monthlyPAYE,
            reformTax: scenario.results.reform.monthlyPAYE,
            netPay: scenario.results.reform.netMonthlyPay,
        }))
    ] : [];

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

                    <div className="flex gap-4 flex-wrap">
                        <button
                            onClick={handleCalculate}
                            className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <>
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="flex items-center gap-2 px-6 py-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl font-medium transition-all duration-200"
                                >
                                    {showBreakdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {showBreakdown ? 'Hide' : 'Show'} Details
                                </button>
                                <button
                                    onClick={() => setShowScenarios(!showScenarios)}
                                    className="flex items-center gap-2 px-6 py-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-all duration-200"
                                >
                                    <Zap className="w-4 h-4" />
                                    What-If Scenarios
                                </button>
                            </>
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

                        {/* What-If Scenarios */}
                        {showScenarios && (
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Zap className="w-5 h-5" />
                                    What-If Scenarios
                                </h2>

                                {/* Quick Scenario Buttons */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Scenarios</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <button
                                            onClick={() => addQuickScenario('+10% Raise', 10)}
                                            className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-all duration-200"
                                        >
                                            +10% Raise
                                        </button>
                                        <button
                                            onClick={() => addQuickScenario('+20% Raise', 20)}
                                            className="px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-all duration-200"
                                        >
                                            +20% Raise
                                        </button>
                                        <button
                                            onClick={() => addQuickScenario('-10% Pay Cut', -10)}
                                            className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all duration-200"
                                        >
                                            -10% Pay Cut
                                        </button>
                                        <button
                                            onClick={() => addQuickScenario('+₦100k Bonus', 0, 100000)}
                                            className="px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-all duration-200"
                                        >
                                            +₦100k Bonus
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Scenario */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Custom Scenario</h3>
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Scenario label"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={customScenario.label}
                                                onChange={(e) => setCustomScenario(prev => ({ ...prev, label: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={customScenario.amount}
                                                onChange={(e) => setCustomScenario(prev => ({ ...prev, amount: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <select
                                                value={customScenario.type}
                                                onChange={(e) => setCustomScenario(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="percentage">Percentage Change</option>
                                                <option value="fixed">Fixed Amount</option>
                                            </select>
                                        </div>
                                        <div>
                                            <button
                                                onClick={addCustomScenario}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200"
                                                disabled={!customScenario.label || !customScenario.amount}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Scenario
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Scenarios List */}
                                {scenarios.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-3">Active Scenarios</h3>
                                        <div className="space-y-3">
                                            {scenarios.map((scenario) => (
                                                <div key={scenario.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-medium text-gray-900">{scenario.label}</span>
                                                            <span className="text-sm text-gray-600">
                                                                {formatCurrency(scenario.monthlyGross)}/month
                                                            </span>
                                                            <span className={`text-sm font-medium ${scenario.results.savings.monthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {scenario.results.savings.monthly >= 0 ? 'Saves' : 'Costs'} {formatCurrency(Math.abs(scenario.results.savings.monthly))}/month
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeScenario(scenario.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Scenarios Chart */}
                                {chartData.length > 1 && (
                                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Scenario Comparison</h3>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                                                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                                                <Legend />
                                                <Bar dataKey="legacyTax" fill="#ef4444" name="Legacy Tax" />
                                                <Bar dataKey="reformTax" fill="#10b981" name="Reform Tax" />
                                                <Bar dataKey="netPay" fill="#3b82f6" name="Net Pay" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Detailed Breakdown */}
                        {showBreakdown && results && (
                            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                {/* Legacy Breakdown */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Legacy System Breakdown</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Gross Annual Income:</span>
                                            <span className="font-medium">{formatCurrency(results.monthlyGross * 12)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Total Allowances:</span>
                                            <span className="font-medium">{formatCurrency(results.legacy.totalAllowances)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Taxable Income:</span>
                                            <span className="font-medium">{formatCurrency(results.legacy.taxableIncome)}</span>
                                        </div>
                                        <div className="border-t pt-3">
                                            <h4 className="font-medium text-gray-900 mb-2">Tax by Bracket:</h4>
                                            {results.legacy.bracketBreakdown.map((bracket, index) => (
                                                <div key={index} className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">{bracket.range} ({bracket.rate}):</span>
                                                    <span className="font-medium">{formatCurrency(bracket.tax)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Reform Breakdown */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reform System Breakdown</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Gross Annual Income:</span>
                                            <span className="font-medium">{formatCurrency(results.monthlyGross * 12)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Total Allowances:</span>
                                            <span className="font-medium">{formatCurrency(results.reform.totalAllowances)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Taxable Income:</span>
                                            <span className="font-medium">{formatCurrency(results.reform.taxableIncome)}</span>
                                        </div>
                                        <div className="border-t pt-3">
                                            <h4 className="font-medium text-gray-900 mb-2">Tax by Bracket:</h4>
                                            {results.reform.bracketBreakdown.map((bracket, index) => (
                                                <div key={index} className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">{bracket.range} ({bracket.rate}):</span>
                                                    <span className="font-medium">{formatCurrency(bracket.tax)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tax Distribution Pie Chart */}

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


                        {/* Important Notes */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Notes</h3>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li>• The 2024 tax reform is pending presidential assent and may be subject to changes</li>
                                <li>• Calculations are based on publicly available information and may not reflect all tax nuances</li>
                                <li>• Additional deductions like pension contributions, NHF, and life insurance premiums can reduce your taxable income</li>
                                <li>• The reform introduces a tax-free threshold of ₦800,000 annually (approximately ₦66,667 monthly)</li>
                                <li>• Consult with a tax professional for personalized advice and accurate calculations</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}