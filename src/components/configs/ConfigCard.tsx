import Link from "next/link";

export interface ConfigCardTool {
	slug: string;
	name: string;
}

export interface ConfigCardFileType {
	slug: string;
	name: string;
}

export interface ConfigCardData {
	id: string;
	slug: string;
	title: string;
	description: string;
	author_name: string;
	file_type: ConfigCardFileType | null;
	tools: ConfigCardTool[];
	total_votes: number;
}

interface ConfigCardProps {
	config: ConfigCardData;
}

export function ConfigCard({ config }: ConfigCardProps) {
	const visibleTools = config.tools.slice(0, 3);
	const hiddenTools = config.tools.length - visibleTools.length;

	return (
		<Link
			href={`/${config.slug}`}
			className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-surface-1 p-5 transition-all duration-150 ease-in-out hover:-translate-y-px hover:border-border-strong hover:bg-bg-surface-2 hover:shadow-lg hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
		>
			<div className="flex items-center justify-between gap-3">
				<span className="inline-flex items-center rounded-full bg-accent-secondary-subtle px-2.5 py-1 text-xs font-medium text-accent-secondary">
					{config.file_type?.name ?? "Config"}
				</span>
				{config.total_votes > 0 ? (
					<span className="text-xs text-text-tertiary">{config.total_votes} votes</span>
				) : null}
			</div>

			<h3 className="line-clamp-2 text-lg font-semibold text-text-primary">{config.title}</h3>

			<p className="line-clamp-2 text-sm text-text-secondary">{config.description}</p>

			<div className="mt-auto flex items-center justify-between gap-3">
				<div className="flex flex-wrap gap-1.5">
					{visibleTools.map((tool) => (
						<span
							key={tool.slug}
							className="inline-flex items-center rounded-full bg-accent-primary-subtle px-2.5 py-1 text-xs text-accent-primary"
						>
							{tool.name}
						</span>
					))}
					{hiddenTools > 0 ? (
						<span className="inline-flex items-center rounded-full bg-accent-primary-subtle px-2.5 py-1 text-xs text-accent-primary">
							+{hiddenTools}
						</span>
					) : null}
				</div>
				<span className="shrink-0 whitespace-nowrap text-xs text-text-tertiary">
					by {config.author_name}
				</span>
			</div>
		</Link>
	);
}
