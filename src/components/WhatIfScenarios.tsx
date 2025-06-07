import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Plus, X } from 'lucide-react';
import type { Results, Scenario, AdditionalDeductions } from '../types';
import { formatCurrency } from '../utils';

interface WhatIfScenariosProps {
    results: Results;
    scenarios: Scenario[];
    setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
    customScenario: {
        label: string;
        amount: string;
        type: 'percentage' | 'fixed';
    };
    setCustomScenario: React.Dispatch<React.SetStateAction<{
        label: string;
        amount: string;
        type: 'percentage' | 'fixed';
    }>>;
    additionalDeductions: AdditionalDeductions;
    addQuickScenario: (label: string, changePercent: number, fixedAmount?: number) => void;
    addCustomScenario: () => void;
    removeScenario: (id: string) => void;
}

export const WhatIfScenarios: React.FC<WhatIfScenariosProps> = ({
    results,
    scenarios,
    customScenario,
    setCustomScenario,
    addQuickScenario,
    addCustomScenario,
    removeScenario
}) => {
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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                What-If Scenarios
            </h2>

            {/* Quick Scenario Buttons */}
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Scenarios</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: '+10% Raise', change: 10, color: 'blue' },
                        { label: '+20% Raise', change: 20, color: 'green' },
                        { label: '-10% Pay Cut', change: -10, color: 'red' },
                        { label: '+₦100k Bonus', change: 0, fixed: 100000, color: 'purple' }
                    ].map(({ label, change, fixed, color }) => (
                        <button
                            key={label}
                            onClick={() => addQuickScenario(label, change, fixed)}
                            className={`px-4 py-3 bg-${color}-100 hover:bg-${color}-200 text-${color}-700 rounded-lg font-medium transition-all duration-200`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Scenario */}
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Custom Scenario</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Scenario label"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={customScenario.label}
                        onChange={(e) => setCustomScenario(prev => ({ ...prev, label: e.target.value }))}
                    />
                    <input
                        type="number"
                        placeholder="Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={customScenario.amount}
                        onChange={(e) => setCustomScenario(prev => ({ ...prev, amount: e.target.value }))}
                    />
                    <select
                        value={customScenario.type}
                        onChange={(e) => setCustomScenario(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="percentage">Percentage Change</option>
                        <option value="fixed">Fixed Amount</option>
                    </select>
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
                                            {scenario.results.savings.monthly >= 0 ? 'Saves' : 'Costs'} {formatCurrency(Math.abs(scenario.results.savings.monthly))}
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
    );

}   