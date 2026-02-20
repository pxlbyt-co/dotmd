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
		<section className="rounded-xl border border-border-default bg-bg-surface-1 p-4 sm:p-5">
			<h2 className="text-h4 font-semibold text-text-primary">Install path</h2>
			<p className="mt-1 text-body-sm text-text-secondary">
				Use this file for each supported tool in your project.
			</p>
			<ul className="mt-4 space-y-3">
				{tools.map((tool) => (
					<li
						key={tool.slug}
						className="rounded-lg border border-border-default bg-bg-surface-0 px-3 py-2 text-body-sm"
					>
						<span className="font-medium text-text-primary">{tool.name}:</span> Save as{" "}
						<code className="font-mono text-code-sm">{fileTypeName}</code> in your project at{" "}
						<code className="font-mono text-code-sm">{path}</code>.
					</li>
				))}
			</ul>
		</section>
	);
}
