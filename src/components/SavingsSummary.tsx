import type { Results } from "../types";
import { formatCurrency } from "../utils";

interface SavingsSummaryProps {
    results: Results;
}

export const SavingsSummary: React.FC<SavingsSummaryProps> = ({ results }) => (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-yellow-900 mb-4 text-center">
            💰 Potential Tax Savings with 2024 Reform
        </h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
            {[
                { label: 'Monthly Savings', value: results.savings.monthly },
                { label: 'Annual Savings', value: results.savings.annual },
                { label: 'Percentage Reduction', value: Math.abs(results.savings.percentage), isPercentage: true }
            ].map(({ label, value, isPercentage }) => (
                <div key={label} className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {isPercentage
                            ? `${results.savings.percentage >= 0 ? '-' : '+'}${value.toFixed(1)}%`
                            : `${value >= 0 ? '+' : ''}${formatCurrency(value)}`
                        }
                    </p>
                </div>
            ))}
        </div>
        {results.savings.monthly < 0 && (
            <p className="text-sm text-red-600 mt-4 text-center bg-red-50 p-3 rounded-lg">
                ⚠️ The reform may result in higher taxes for your income level
            </p>
        )}
    </div>
);