import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { Results } from '../types';
import { TaxSystemCard } from './TaxSystemCard';


interface ResultsComparisonProps {
    results: Results;
}

export const ResultsComparison: React.FC<ResultsComparisonProps> = ({ results }) => (
    <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <TaxSystemCard
            title="Legacy Tax System"
            subtitle="Pre-2024 Reform"
            result={results.legacy}
            color="red"
            icon={TrendingUp}
        />
        <TaxSystemCard
            title="2024 Tax Reform"
            subtitle="Pending Presidential Assent"
            result={results.reform}
            color="green"
            icon={TrendingDown}
        />
    </div>
);

