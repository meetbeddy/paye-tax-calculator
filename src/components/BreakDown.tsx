import type { Results } from '../types';
import { formatCurrency } from '../utils';

interface DetailedBreakdownProps {
    results: Results;
}

export function DetailedBreakdown({ results }: DetailedBreakdownProps) {
    return (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <LegacyBreakdown results={results} />
            <ReformBreakdown results={results} />
        </div>
    );
}

function LegacyBreakdown({ results }: { results: Results }) {
    return (
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
    );
}

function ReformBreakdown({ results }: { results: Results }) {
    return (
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
    );
}