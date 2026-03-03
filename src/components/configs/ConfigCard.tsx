"use client";

import { FileCode } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";

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
	const [, setQuickview] = useQueryState("quickview");
	const visibleTools = config.tools.slice(0, 3);
	const hiddenTools = config.tools.length - visibleTools.length;

	return (
		<Link
			href={`/${config.slug}`}
			onClick={(e) => {
				// If it's a standard left click without modifiers, open the quick view drawer
				if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
					e.preventDefault();
					void setQuickview(config.slug);
				}
			}}
			className="group flex flex-col gap-3 rounded-lg border border-border-default bg-bg-surface-0 p-5 transition-all duration-200 ease-out hover:-translate-y-px hover:border-accent-primary/40 hover:bg-bg-surface-1 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base"
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-text-secondary">
					<FileCode className="h-4 w-4 text-accent-primary/70 transition-colors group-hover:text-accent-primary" />
					<span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary transition-colors group-hover:text-text-primary">
						{config.file_type?.name ?? "Config"}
					</span>
				</div>
				{config.total_votes > 0 ? (
					<span className="font-mono text-[11px] text-text-tertiary transition-colors group-hover:text-accent-primary">
						↑ {config.total_votes}
					</span>
				) : null}
			</div>

			<h3 className="line-clamp-2 font-mono text-base font-semibold tracking-tight text-text-primary transition-colors group-hover:text-accent-primary">
				{config.title}
			</h3>

			<p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
				{config.description}
			</p>

			<div className="mt-auto flex items-center justify-between gap-3 pt-2">
				<div className="flex flex-wrap gap-1.5">
					{visibleTools.map((tool) => (
						<span
							key={tool.slug}
							className="inline-flex items-center rounded border border-border-subtle bg-bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors group-hover:border-border-default"
						>
							{tool.name}
						</span>
					))}
					{hiddenTools > 0 ? (
						<span className="inline-flex items-center rounded border border-border-subtle bg-bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
							+{hiddenTools}
						</span>
					) : null}
				</div>
				<span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-text-tertiary transition-colors group-hover:text-text-secondary">
					@{config.author_name}
				</span>
			</div>
		</Link>
	);
}
