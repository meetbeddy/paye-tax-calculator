import type { TaxBracket } from "./types";

export const LEGACY_BRACKETS: TaxBracket[] = [
	{ limit: 300_000, rate: 0.07 },
	{ limit: 600_000, rate: 0.11 },
	{ limit: 1_100_000, rate: 0.15 },
	{ limit: 1_600_000, rate: 0.19 },
	{ limit: 3_200_000, rate: 0.21 },
	{ limit: Infinity, rate: 0.24 },
];

export const REFORM_BRACKETS: TaxBracket[] = [
	{ limit: 800_000, rate: 0 },
	{ limit: 3_000_000, rate: 0.15 },
	{ limit: 12_000_000, rate: 0.18 },
	{ limit: 25_000_000, rate: 0.21 },
	{ limit: 50_000_000, rate: 0.23 },
	{ limit: Infinity, rate: 0.25 },
];

export const CHART_COLORS = [
	"#10b981",
	"#ef4444",
	"#f59e0b",
	"#3b82f6",
	"#8b5cf6",
];
