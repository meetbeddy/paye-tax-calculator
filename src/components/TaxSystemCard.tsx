import type { CalculationResult } from "../types";
import { formatCurrency } from "../utils";

interface TaxSystemCardProps {
    title: string;
    subtitle: string;
    result: CalculationResult;
    color: 'red' | 'green';
    icon: React.ComponentType<{ className?: string }>;
}

export const TaxSystemCard: React.FC<TaxSystemCardProps> = ({ title, subtitle, result, color, icon: Icon }) => (
    <div className={`bg-white border-l-4 border-${color}-400 rounded-xl shadow-lg p-6`}>
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 bg-${color}-100 rounded-lg`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
        </div>
        <div className="space-y-4">
            {[
                { label: 'Monthly PAYE', value: formatCurrency(result.monthlyPAYE), highlight: true },
                { label: 'Annual PAYE', value: formatCurrency(result.annualPAYE) },
                { label: 'Effective Rate', value: `${result.effectiveTaxRate}%` },
                { label: 'Net Monthly Pay', value: formatCurrency(result.netMonthlyPay), highlight: true, bg: true }
            ].map(({ label, value, highlight, bg }) => (
                <div
                    key={label}
                    className={`flex justify-between items-center py-2 ${bg ? `bg-${color}-50 rounded-lg px-3` : 'border-b border-gray-100'}`}
                >
                    <span className={`text-gray-700 ${bg ? 'font-medium' : ''}`}>{label}:</span>
                    <span className={`font-${highlight ? 'semibold' : 'medium'} text-${color}-${bg ? '800' : '700'} ${highlight ? 'text-lg' : ''}`}>
                        {value}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

