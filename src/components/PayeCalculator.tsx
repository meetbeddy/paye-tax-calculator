import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { WhatIfScenarios } from './WhatIfScenarios';
import { SalaryInputSection } from './SalaryInputSection';
import { ResultsComparison } from './ResultDisplay';
import { SavingsSummary } from './SavingsSummary';
import type { AdditionalDeductions, Results, Scenario } from '../types';
import { calculateResults, } from '../utils';
import { DetailedBreakdown } from './BreakDown';
import { TaxCharts } from './TaxCharts';


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
                            <DetailedBreakdown results={results} />
                        )}

                        {/* Tax Distribution Pie Chart */}
                        <TaxCharts results={results} />

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
