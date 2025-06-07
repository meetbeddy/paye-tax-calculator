import React from 'react';
import type { AdditionalDeductions, Results, Scenario } from '../../types';
import { SalaryInputSection } from '../SalaryInputSection';
import { WhatIfScenarios } from '../WhatIfScenarios';
import { DetailedBreakdown } from '../BreakDown';
import { TaxCharts } from '../TaxCharts';
import { ResultsComparison } from '../ResultDisplay';
import { SavingsSummary } from '../SavingsSummary';


interface TaxCalculatorResultsProps {
  // Salary Input Props
  monthlyGross: string;
  setMonthlyGross: (value: string) => void;
  inputType: 'monthly' | 'annual';
  setInputType: (type: 'monthly' | 'annual') => void;
  additionalDeductions: AdditionalDeductions;
  setAdditionalDeductions: (deductions: AdditionalDeductions) => void;
  onCalculate: () => void;
  onClear: () => void;
  hasResults: boolean;
  showBreakdown: boolean;
  setShowBreakdown: (show: boolean) => void;
  showScenarios: boolean;
  setShowScenarios: (show: boolean) => void;

  // Results Props
  results: Results | null;

  // Scenarios Props
  scenarios: Scenario[];
  addQuickScenario: (label: string, changePercent: number, fixedAmount?: number) => void;
  addCustomScenario: () => void;
  customScenario: {
    label: string;
    amount: string;
    type: 'percentage' | 'fixed';
  };
  setCustomScenario: (scenario: { label: string; amount: string; type: 'percentage' | 'fixed' }) => void;
  removeScenario: (id: string) => void;
  setScenarios: (scenarios: Scenario[]) => void;
}

const TaxCalculatorResults: React.FC<TaxCalculatorResultsProps> = ({
  // Salary Input Props
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
  setShowScenarios,

  // Results Props
  results,

  // Scenarios Props
  scenarios,
  addQuickScenario,
  addCustomScenario,
  customScenario,
  setCustomScenario,
  removeScenario,
  setScenarios
}) => {
  return (
    <>
      <SalaryInputSection
        monthlyGross={monthlyGross}
        setMonthlyGross={setMonthlyGross}
        inputType={inputType}
        setInputType={setInputType}
        additionalDeductions={additionalDeductions}
        setAdditionalDeductions={setAdditionalDeductions}
        onCalculate={onCalculate}
        onClear={onClear}
        hasResults={hasResults}
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
          {showBreakdown && (
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
    </>
  );
};

export default TaxCalculatorResults;