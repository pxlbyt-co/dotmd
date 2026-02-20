"use client";

import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { TagFilter } from "@/components/filters/TagFilter";
import { ToolFilter } from "@/components/filters/ToolFilter";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { TAG_CATEGORIES } from "@/lib/constants";

const SORT_OPTIONS = ["popular", "newest", "alphabetical"] as const;

export type BrowseSort = (typeof SORT_OPTIONS)[number];

type ToolOption = {
	id: string;
	slug: string;
	name: string;
};

type TagOption = {
	id: string;
	slug: string;
	name: string;
	category: (typeof TAG_CATEGORIES)[number];
};

interface FilterBarProps {
	tools: ToolOption[];
	tags: TagOption[];
	selectedTool?: string;
	selectedTag?: string;
	sort: BrowseSort;
}

export function FilterBar({ tools, tags, selectedTool, selectedTag, sort }: FilterBarProps) {
	const [, setQuery] = useQueryStates(
		{
			tool: parseAsString,
			tag: parseAsString,
			sort: parseAsStringLiteral(SORT_OPTIONS).withDefault("popular"),
			page: parseAsInteger.withDefault(1),
		},
		{ history: "push", shallow: false },
	);

	return (
		<div className="rounded-xl border border-border-default bg-bg-surface-0 p-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end">
				<ToolFilter tools={tools} selectedTool={selectedTool} />
				<TagFilter tags={tags} selectedTag={selectedTag} />
				<div className="flex min-w-44 flex-col gap-2">
					<label
						htmlFor="sort-filter"
						className="text-xs font-medium text-text-secondary uppercase tracking-wide"
					>
						Sort
					</label>
					<Select
						value={sort}
						onValueChange={(value: BrowseSort) => {
							setQuery({
								sort: value,
								page: 1,
							});
						}}
					>
						<SelectTrigger id="sort-filter" className="w-full bg-bg-surface-1">
							<SelectValue placeholder="Most popular" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="popular">Most popular</SelectItem>
							<SelectItem value="newest">Newest</SelectItem>
							<SelectItem value="alphabetical">Alphabetical</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					type="button"
					variant="ghost"
					className="self-start lg:mb-0.5"
					onClick={() => {
						setQuery({
							tool: null,
							tag: null,
							sort: "popular",
							page: 1,
						});
					}}
				>
					Clear filters
				</Button>
			</div>
		</div>
	);
}
