import type { AdditionalDeductions } from "../types";

interface DeductionsInputProps {
    additionalDeductions: AdditionalDeductions;
    setAdditionalDeductions: (value: AdditionalDeductions | ((prev: AdditionalDeductions) => AdditionalDeductions)) => void;
}

export const DeductionsInput: React.FC<DeductionsInputProps> = ({ additionalDeductions, setAdditionalDeductions }) => (
    <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Monthly Deductions (Optional)</h3>
        <div className="grid md:grid-cols-3 gap-4">
            {[
                { key: 'pension' as keyof AdditionalDeductions, label: 'Pension Contribution', placeholder: '8% of basic salary' },
                { key: 'nhf' as keyof AdditionalDeductions, label: 'NHF Contribution', placeholder: '2.5% of basic salary' },
                { key: 'insurance' as keyof AdditionalDeductions, label: 'Life Insurance Premium', placeholder: 'Monthly premium' }
            ].map(({ key, label, placeholder }) => (
                <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₦</span>
                        <input
                            type="number"
                            placeholder={placeholder}
                            className="w-full pl-7 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={additionalDeductions[key]}
                            onChange={(e) => setAdditionalDeductions(prev => ({ ...prev, [key]: e.target.value }))}
                            min="0"
                        />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

