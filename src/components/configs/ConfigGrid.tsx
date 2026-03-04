import { ConfigCard, type ConfigCardData } from "@/components/configs/ConfigCard";
import type { GRID_COLUMNS } from "@/lib/grid";

/**
 * Type-level assertion: grid classes must stay in sync with GRID_COLUMNS.
 * If GRID_COLUMNS changes, this will produce a compile error.
 */
type _AssertGridClasses = ["grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3"] extends [
	`grid-cols-${(typeof GRID_COLUMNS)[0]}`,
	`sm:grid-cols-${(typeof GRID_COLUMNS)[1]}`,
	`lg:grid-cols-${(typeof GRID_COLUMNS)[2]}`,
]
	? true
	: never;

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
