import { ConfigCard, type ConfigCardData } from "@/components/configs/ConfigCard";
import { GRID_COLUMNS } from "@/lib/grid";

/**
 * Keep this grid aligned with the breakpoints used in `GRID_COLUMNS`.
 */
const _GRID_COLUMN_CLASS_ASSERT: [
	`grid-cols-${(typeof GRID_COLUMNS)[0]}`,
	`sm:grid-cols-${(typeof GRID_COLUMNS)[1]}`,
	`lg:grid-cols-${(typeof GRID_COLUMNS)[2]}`,
] = ["grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3"];

interface ConfigGridProps {
	configs: ConfigCardData[];
	emptyTitle?: string;
	emptyDescription?: string;
}

export function ConfigGrid({
	configs,
	emptyTitle = "No configs yet",
	emptyDescription = "Published configs will show up here once the first submissions go live.",
}: ConfigGridProps) {
	if (configs.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border-default bg-bg-surface-1 px-6 py-12 text-center">
				<h3 className="text-lg font-semibold text-text-primary">{emptyTitle}</h3>
				<p className="mt-2 text-sm text-text-secondary">{emptyDescription}</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
			{configs.map((config) => (
				<ConfigCard key={config.id} config={config} />
			))}
		</div>
	);
}
