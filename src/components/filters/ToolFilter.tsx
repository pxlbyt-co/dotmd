"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type ToolOption = {
	id: string;
	slug: string;
	name: string;
};

interface ToolFilterProps {
	tools: ToolOption[];
	selectedTool?: string;
}

export function ToolFilter({ tools, selectedTool }: ToolFilterProps) {
	const [, setQuery] = useQueryStates(
		{
			tool: parseAsString,
			page: parseAsInteger.withDefault(1),
		},
		{ history: "push", shallow: false },
	);

	return (
		<div className="flex min-w-44 flex-col gap-2">
			<label
				htmlFor="tool-filter"
				className="text-xs font-medium text-text-secondary uppercase tracking-wide"
			>
				Tool
			</label>
			<Select
				value={selectedTool ?? "all"}
				onValueChange={(value) => {
					setQuery({
						tool: value === "all" ? null : value,
						page: 1,
					});
				}}
			>
				<SelectTrigger id="tool-filter" className="w-full bg-bg-surface-1">
					<SelectValue placeholder="All tools" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All tools</SelectItem>
					{tools.map((tool) => (
						<SelectItem key={tool.id} value={tool.slug}>
							{tool.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
