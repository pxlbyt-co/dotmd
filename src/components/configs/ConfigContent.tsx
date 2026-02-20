import { CopyButton } from "@/components/configs/CopyButton";

interface ConfigContentProps {
	content: string;
	fileName: string;
}

function classifyLine(line: string): string {
	const trimmed = line.trimStart();

	if (trimmed.startsWith("# ")) return "text-accent-primary font-semibold";
	if (trimmed.startsWith("## ")) return "text-accent-primary";
	if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) return "text-accent-secondary";
	if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return "text-text-primary";
	if (/^\d+\.\s/.test(trimmed)) return "text-text-primary";
	if (trimmed.startsWith("> "))
		return "text-text-tertiary italic border-l-2 border-accent-primary pl-3";
	if (trimmed.startsWith("```")) return "text-info";
	if (trimmed.startsWith("---") || trimmed.startsWith("***")) return "text-text-tertiary";
	if (trimmed === "") return "text-text-primary";

	return "text-text-secondary";
}

export function ConfigContent({ content, fileName }: ConfigContentProps) {
	const lines = content.split("\n");

	return (
		<section className="rounded-xl border border-border-default bg-bg-surface-1">
			<div className="flex items-center justify-between border-b border-border-default px-4 py-3 sm:px-5">
				<p className="font-mono text-xs text-text-secondary">{fileName}</p>
				<CopyButton content={content} />
			</div>
			<div className="overflow-x-auto p-4 sm:p-5">
				<pre className="font-mono text-code">
					{lines.map((line, i) => {
						const lineKey = `line-${i}`;
						return (
							<div key={lineKey} className="flex">
								<span className="mr-4 inline-block w-8 shrink-0 select-none text-right text-text-placeholder">
									{i + 1}
								</span>
								<span className={classifyLine(line)}>{line || " "}</span>
							</div>
						);
					})}
				</pre>
			</div>
		</section>
	);
}
