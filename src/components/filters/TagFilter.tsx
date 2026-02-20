"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TAG_CATEGORIES } from "@/lib/constants";

type TagOption = {
	id: string;
	slug: string;
	name: string;
	category: (typeof TAG_CATEGORIES)[number];
};

interface TagFilterProps {
	tags: TagOption[];
	selectedTag?: string;
}

const CATEGORY_LABELS: Record<(typeof TAG_CATEGORIES)[number], string> = {
	framework: "Framework",
	language: "Language",
	use_case: "Use case",
};

export function TagFilter({ tags, selectedTag }: TagFilterProps) {
	const [, setQuery] = useQueryStates(
		{
			tag: parseAsString,
			page: parseAsInteger.withDefault(1),
		},
		{ history: "push", shallow: false },
	);

	return (
		<div className="flex min-w-52 flex-col gap-2">
			<label
				htmlFor="tag-filter"
				className="text-xs font-medium text-text-secondary uppercase tracking-wide"
			>
				Tag
			</label>
			<Select
				value={selectedTag ?? "all"}
				onValueChange={(value) => {
					setQuery({
						tag: value === "all" ? null : value,
						page: 1,
					});
				}}
			>
				<SelectTrigger id="tag-filter" className="w-full bg-bg-surface-1">
					<SelectValue placeholder="All tags" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All tags</SelectItem>
					{TAG_CATEGORIES.map((category) => {
						const categoryTags = tags.filter((tag) => tag.category === category);

						if (categoryTags.length === 0) {
							return null;
						}

						return (
							<SelectGroup key={category}>
								<SelectLabel>{CATEGORY_LABELS[category]}</SelectLabel>
								{categoryTags.map((tag) => (
									<SelectItem key={tag.id} value={tag.slug}>
										{tag.name}
									</SelectItem>
								))}
							</SelectGroup>
						);
					})}
				</SelectContent>
			</Select>
		</div>
	);
}
