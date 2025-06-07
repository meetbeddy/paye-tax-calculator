import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Results } from '../types';
import { formatCurrency } from '../utils';
import { CHART_COLORS } from '../constants';

interface TaxChartsProps {
    results: Results;
}

export function TaxCharts({ results }: TaxChartsProps) {
    return (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <TaxComparisonChart results={results} />
            <IncomeBreakdownChart results={results} />
        </div>
    );
}

function TaxComparisonChart({ results }: { results: Results }) {
    const chartData = [
        {
            name: 'Legacy System',
            tax: results.legacy.monthlyPAYE,
            net: results.legacy.netMonthlyPay
        },
        {
            name: '2024 Reform',
            tax: results.reform.monthlyPAYE,
            net: results.reform.netMonthlyPay
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax & Net Pay Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
    );
}

function IncomeBreakdownChart({ results }: { results: Results }) {
    const otherDeductions = Math.max(0, results.monthlyGross - results.reform.netMonthlyPay - results.reform.monthlyPAYE);

    const pieData = [
        { name: 'Net Pay', value: results.reform.netMonthlyPay, fill: CHART_COLORS[0] },
        { name: 'PAYE Tax', value: results.reform.monthlyPAYE, fill: CHART_COLORS[1] },
        { name: 'Other Deductions', value: otherDeductions, fill: CHART_COLORS[2] }
    ].filter(item => item.value > 0);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income Breakdown (2024 Reform)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(1)}%`}
                        labelLine={false}
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
