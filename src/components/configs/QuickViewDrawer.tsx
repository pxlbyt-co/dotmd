"use client";

import { Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CopyButton } from "./CopyButton";

export function QuickViewDrawer() {
	const [slug, setSlug] = useQueryState("quickview");
	const [content, setContent] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!slug) {
			setContent(null);
			setError(null);
			return;
		}

		let isMounted = true;
		const fetchConfig = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await fetch(`/api/configs/${slug}`);
				if (!res.ok) {
					throw new Error("Failed to load config");
				}
				const data = await res.json();

				if (isMounted) {
					setContent(data.content);
				}
			} catch (err) {
				if (isMounted) {
					setError(err instanceof Error ? err.message : "An error occurred");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		void fetchConfig();

		return () => {
			isMounted = false;
		};
	}, [slug]);

	const classifyLine = (line: string): string => {
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
	};

	return (
		<Sheet open={!!slug} onOpenChange={(open) => !open && setSlug(null)}>
			<SheetContent className="w-full sm:max-w-2xl bg-bg-base border-l border-border-default p-0 flex flex-col shadow-2xl">
				<div className="flex flex-col border-b border-border-default bg-bg-surface-0 px-6 py-4">
					<div className="flex items-center justify-between mb-2">
						<span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
							{"// Quick View"}
						</span>
						{content && !loading ? <CopyButton content={content} /> : null}
					</div>
					<SheetTitle className="font-mono text-lg font-bold text-accent-primary truncate">
						{slug ? `/${slug}` : "Loading..."}
					</SheetTitle>
				</div>

				<div className="flex-1 overflow-y-auto bg-bg-base p-6">
					{loading ? (
						<div className="flex h-full items-center justify-center text-text-secondary">
							<Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
						</div>
					) : error ? (
						<div className="rounded-md border border-color-error-subtle bg-color-error-subtle/10 p-4 text-sm text-color-error font-mono">
							<span className="mr-2">&gt;</span> ERROR: {error}
						</div>
					) : content ? (
						<pre className="font-mono text-sm leading-relaxed">
							{content.split("\n").map((line, i) => (
								<div
									key={crypto.randomUUID()}
									className="flex group hover:bg-bg-surface-1/50 transition-colors"
								>
									<span className="mr-4 inline-block w-8 shrink-0 select-none text-right text-text-placeholder/40 group-hover:text-text-placeholder transition-colors text-xs pt-0.5">
										{i + 1}
									</span>
									<span
										className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${classifyLine(
											line,
										)}`}
									>
										{line || " "}
									</span>
								</div>
							))}
						</pre>
					) : null}
				</div>

				{content && (
					<div className="border-t border-border-default bg-bg-surface-0 p-4 flex justify-between items-center text-xs font-mono text-text-tertiary">
						<span>{content.split("\n").length} lines</span>
						<button
							type="button"
							className="text-accent-primary hover:underline cursor-pointer"
							onClick={() => {
								window.location.href = `/${slug}`;
							}}
						>
							[View full details]
						</button>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
