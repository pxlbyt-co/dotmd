import { FileCode } from "lucide-react";
import { CopyButton } from "@/components/configs/CopyButton";

interface ConfigContentProps {
	content: string;
	fileName: string;
}

function classifyLine(line: string): string {
	const trimmed = line.trimStart();

	if (trimmed.startsWith("# ")) return "text-accent-primary font-bold";
	if (trimmed.startsWith("## ")) return "text-accent-primary font-semibold";
	if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) return "text-accent-secondary";
	if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return "text-text-primary";
	if (/^\d+\.\s/.test(trimmed)) return "text-text-primary";
	if (trimmed.startsWith("> "))
		return "text-text-tertiary italic border-l-2 border-accent-primary pl-3";
	if (trimmed.startsWith("```")) return "text-info opacity-70";
	if (trimmed.startsWith("---") || trimmed.startsWith("***"))
		return "text-text-tertiary opacity-50";
	if (trimmed === "") return "text-text-primary";

	return "text-text-secondary";
}

export function ConfigContent({ content, fileName }: ConfigContentProps) {
	const lines = content.split("\n");

	return (
		<section className="rounded-lg border border-border-default bg-bg-base shadow-xl overflow-hidden">
			<div className="flex items-center justify-between border-b border-border-default bg-bg-surface-0 px-4 py-2.5">
				<div className="flex items-center gap-2">
					<FileCode className="h-4 w-4 text-accent-primary/70" />
					<span className="font-mono text-xs font-medium text-text-primary">{fileName}</span>
				</div>
				<CopyButton content={content} />
			</div>
			<div className="overflow-x-auto p-4 sm:p-5">
				<pre className="font-mono text-sm leading-relaxed">
					{lines.map((line, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Lines are static and reordering does not occur
						<div key={i} className="group flex hover:bg-bg-surface-1/50 transition-colors">
							<span className="mr-4 inline-block w-8 shrink-0 select-none text-right text-text-placeholder/40 group-hover:text-text-placeholder transition-colors text-xs pt-0.5">
								{i + 1}
							</span>
							<span
								className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${classifyLine(line)}`}
							>
								{line || " "}
							</span>
						</div>
					))}
				</pre>
			</div>
		</section>
	);
}
