import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calculator } from 'lucide-react';
import { WhatIfScenarios } from './WhatIfScenarios';
import { SalaryInputSection } from './SalaryInputSection';
import { ResultsComparison } from './ResultDisplay';
import { SavingsSummary } from './SavingsSummary';
import type { AdditionalDeductions, Results, Scenario } from '../types';
import { calculateResults, formatCurrency } from '../utils';
import { CHART_COLORS } from '../constants';


export default function PayeCalculator() {
    const [monthlyGross, setMonthlyGross] = useState<string>('');
    const [inputType, setInputType] = useState<'monthly' | 'annual'>('monthly');
    const [results, setResults] = useState<Results | null>(null);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
    const [showScenarios, setShowScenarios] = useState<boolean>(false);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [customScenario, setCustomScenario] = useState({
        label: '',
        amount: '',
        type: 'percentage' as 'percentage' | 'fixed'
    });
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

                <SalaryInputSection
                    monthlyGross={monthlyGross}
                    setMonthlyGross={setMonthlyGross}
                    inputType={inputType}
                    setInputType={setInputType}
                    additionalDeductions={additionalDeductions}
                    setAdditionalDeductions={setAdditionalDeductions}
                    onCalculate={handleCalculate}
                    onClear={handleClear}
                    hasResults={!!results}
                    showBreakdown={showBreakdown}
                    setShowBreakdown={setShowBreakdown}
                    showScenarios={showScenarios}
                    setShowScenarios={setShowScenarios}
                />

                {results && (
                    <>
                        <ResultsComparison results={results} />
                        <SavingsSummary results={results} />
                        {showScenarios && (
                            <WhatIfScenarios
                                scenarios={scenarios}
                                addQuickScenario={addQuickScenario}
                                addCustomScenario={addCustomScenario}
                                customScenario={customScenario}
                                setCustomScenario={setCustomScenario}
                                removeScenario={removeScenario}
                                results={results}
                                setScenarios={setScenarios}
                                additionalDeductions={additionalDeductions}
                            />
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
                                                { name: 'Net Pay', value: results.reform.netMonthlyPay, fill: CHART_COLORS[0] },
                                                { name: 'PAYE Tax', value: results.reform.monthlyPAYE, fill: CHART_COLORS[1] },
                                                { name: 'Other Deductions', value: Math.max(0, results.monthlyGross - results.reform.netMonthlyPay - results.reform.monthlyPAYE), fill: CHART_COLORS[2] }
                                            ].filter(item => item.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(1)}%`}
                                            labelLine={false}
                                        >
                                            {[
                                                { name: 'Net Pay', value: results.reform.netMonthlyPay, fill: CHART_COLORS[0] },
                                                { name: 'PAYE Tax', value: results.reform.monthlyPAYE, fill: CHART_COLORS[1] },
                                                { name: 'Other Deductions', value: Math.max(0, results.monthlyGross - results.reform.netMonthlyPay - results.reform.monthlyPAYE), fill: CHART_COLORS[2] }
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
