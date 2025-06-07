import React from 'react';
import { FileText } from 'lucide-react';
import type { AdditionalDeductions } from '../types';
import { DeductionsInput } from './DeductionsInput';
import { ActionButtons } from './ActionButtons';

interface SalaryInputSectionProps {
    monthlyGross: string;
    setMonthlyGross: (value: string) => void;
    inputType: 'monthly' | 'annual';
    setInputType: (value: 'monthly' | 'annual') => void;
    additionalDeductions: AdditionalDeductions;
    setAdditionalDeductions: (value: AdditionalDeductions | ((prev: AdditionalDeductions) => AdditionalDeductions)) => void;
    onCalculate: () => void;
    onClear: () => void;
    hasResults: boolean;
    showBreakdown: boolean;
    setShowBreakdown: (value: boolean) => void;
    showScenarios: boolean;
    setShowScenarios: (value: boolean) => void;
}

export const SalaryInputSection: React.FC<SalaryInputSectionProps> = ({
    monthlyGross,
    setMonthlyGross,
    inputType,
    setInputType,
    additionalDeductions,
    setAdditionalDeductions,
    onCalculate,
    onClear,
    hasResults,
    showBreakdown,
    setShowBreakdown,
    showScenarios,
    setShowScenarios
}) => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Salary Information
        </h2>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Input Type</label>
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

        <DeductionsInput
            additionalDeductions={additionalDeductions}
            setAdditionalDeductions={setAdditionalDeductions}
        />

        <ActionButtons
            onCalculate={onCalculate}
            onClear={onClear}
            hasResults={hasResults}
            monthlyGross={monthlyGross}
            showBreakdown={showBreakdown}
            setShowBreakdown={setShowBreakdown}
            showScenarios={showScenarios}
            setShowScenarios={setShowScenarios}
        />
    </div>
);
