import { Eye, EyeOff, Zap } from "lucide-react";

interface ActionButtonsProps {
    onCalculate: () => void;
    onClear: () => void;
    hasResults: boolean;
    monthlyGross: string;
    showBreakdown: boolean;
    setShowBreakdown: (value: boolean) => void;
    showScenarios: boolean;
    setShowScenarios: (value: boolean) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onCalculate,
    onClear,
    hasResults,
    monthlyGross,
    showBreakdown,
    setShowBreakdown,
    showScenarios,
    setShowScenarios
}) => (
    <div className="flex gap-4 flex-wrap">
        <button
            onClick={onCalculate}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!monthlyGross}
        >
            Calculate Tax
        </button>
        <button
            onClick={onClear}
            className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
        >
            Clear
        </button>
        {hasResults && (
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
);