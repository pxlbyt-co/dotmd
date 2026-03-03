import { FolderTree } from "lucide-react";

interface InstallTool {
	slug: string;
	name: string;
}

interface InstallPathsProps {
	tools: InstallTool[];
	fileTypeName: string;
	defaultPath: string | null;
}

export function InstallPaths({ tools, fileTypeName, defaultPath }: InstallPathsProps) {
	const path = defaultPath ?? fileTypeName;

	return (
		<section className="rounded-lg border border-border-default bg-bg-surface-0 shadow-sm overflow-hidden">
			<div className="flex items-center gap-2 border-b border-border-default bg-bg-surface-1 px-4 py-2.5">
				<span className="font-mono text-xs font-medium uppercase tracking-widest text-text-tertiary">
					{"// Installation"}
				</span>
			</div>
			<div className="p-4 sm:p-5">
				<p className="mb-4 font-mono text-xs text-text-secondary">
					<span className="text-accent-primary mr-2">{">"}</span>
					Add this file to your project repository:
				</p>
				<ul className="space-y-2">
					{tools.map((tool) => (
						<li
							key={tool.slug}
							className="group flex flex-col gap-2 rounded-md border border-border-default bg-bg-base p-3 transition-all duration-200 hover:border-accent-primary/40 hover:bg-bg-surface-1 sm:flex-row sm:items-center"
						>
							<div className="min-w-[160px] font-mono text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
								{tool.name}
							</div>
							<span className="hidden font-mono text-xs text-text-tertiary sm:inline-block">
								--path=
							</span>
							<div className="flex flex-1 items-center gap-2 overflow-x-auto rounded bg-bg-surface-0 px-2.5 py-1.5 border border-border-subtle group-hover:border-border-default transition-colors">
								<FolderTree className="h-3.5 w-3.5 shrink-0 text-text-tertiary group-hover:text-accent-primary/70 transition-colors" />
								<code className="whitespace-nowrap font-mono text-xs text-text-primary">
									{path}
								</code>
							</div>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
