"use client";

import { useAction } from "next-safe-action/hooks";
import { useMemo, useState } from "react";

import { submitConfig } from "@/actions/submit-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SelectOption = {
	id: string;
	name: string;
};

type TagOption = SelectOption & {
	category: "framework" | "language" | "use_case";
};

type ConfigSubmitFormProps = {
	fileTypes: SelectOption[];
	tools: SelectOption[];
	tags: TagOption[];
};

function categoryLabel(category: TagOption["category"]): string {
	if (category === "use_case") return "Use case";
	return category.charAt(0).toUpperCase() + category.slice(1);
}

export function ConfigSubmitForm({ fileTypes, tools, tags }: ConfigSubmitFormProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [content, setContent] = useState("");
	const [fileTypeId, setFileTypeId] = useState("");
	const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [submittedSlug, setSubmittedSlug] = useState<string | null>(null);

	const { execute, result, isPending } = useAction(submitConfig, {
		onSuccess(data) {
			setSubmittedSlug(data.data?.slug ?? null);
		},
	});

	const tagsByCategory = useMemo(() => {
		return {
			framework: tags.filter((tag) => tag.category === "framework"),
			language: tags.filter((tag) => tag.category === "language"),
			use_case: tags.filter((tag) => tag.category === "use_case"),
		};
	}, [tags]);

	const getFieldErrors = (field: string): string[] | undefined => {
		const validationErrors = result.validationErrors as
			| Record<string, { _errors?: string[] }>
			| undefined;
		const errors = validationErrors?.[field]?._errors;

		return Array.isArray(errors) ? errors : undefined;
	};

	return (
		<div className="space-y-6 rounded-xl border border-border-default bg-bg-surface-1 p-5 sm:p-6">
			<form
				className="space-y-5"
				onSubmit={(event) => {
					event.preventDefault();
					setSubmittedSlug(null);
					execute({
						title,
						description,
						content,
						file_type_id: fileTypeId,
						tool_ids: selectedToolIds,
						tag_ids: selectedTagIds,
					});
				}}
			>
				<div className="space-y-2">
					<label htmlFor="title" className="text-body-sm font-medium text-text-primary">
						Title
					</label>
					<Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
					{getFieldErrors("title") ? (
						<p className="text-xs text-destructive">{getFieldErrors("title")?.join(" ")}</p>
					) : null}
				</div>

				<div className="space-y-2">
					<label htmlFor="description" className="text-body-sm font-medium text-text-primary">
						Description
					</label>
					<Textarea
						id="description"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						rows={4}
					/>
					{getFieldErrors("description") ? (
						<p className="text-xs text-destructive">{getFieldErrors("description")?.join(" ")}</p>
					) : null}
				</div>

				<div className="space-y-2">
					<label htmlFor="content" className="text-body-sm font-medium text-text-primary">
						Content
					</label>
					<Textarea
						id="content"
						value={content}
						onChange={(event) => setContent(event.target.value)}
						rows={14}
						className="font-mono"
					/>
					{getFieldErrors("content") ? (
						<p className="text-xs text-destructive">{getFieldErrors("content")?.join(" ")}</p>
					) : null}
				</div>

				<div className="space-y-2">
					<label htmlFor="file-type" className="text-body-sm font-medium text-text-primary">
						File type
					</label>
					<Select value={fileTypeId} onValueChange={setFileTypeId}>
						<SelectTrigger id="file-type" className="w-full bg-bg-surface-1">
							<SelectValue placeholder="Select a file type" />
						</SelectTrigger>
						<SelectContent>
							{fileTypes.map((fileType) => (
								<SelectItem key={fileType.id} value={fileType.id}>
									{fileType.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{getFieldErrors("file_type_id") ? (
						<p className="text-xs text-destructive">{getFieldErrors("file_type_id")?.join(" ")}</p>
					) : null}
				</div>

				<div className="space-y-2">
					<p className="text-body-sm font-medium text-text-primary">Tools</p>
					<div className="grid gap-2 sm:grid-cols-2">
						{tools.map((tool) => {
							const checked = selectedToolIds.includes(tool.id);

							return (
								<label
									key={tool.id}
									className="flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm text-text-primary"
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={(event) => {
											if (event.target.checked) {
												setSelectedToolIds((current) => [...current, tool.id]);
												return;
											}

											setSelectedToolIds((current) => current.filter((id) => id !== tool.id));
										}}
									/>
									{tool.name}
								</label>
							);
						})}
					</div>
					{getFieldErrors("tool_ids") ? (
						<p className="text-xs text-destructive">{getFieldErrors("tool_ids")?.join(" ")}</p>
					) : null}
				</div>

				<div className="space-y-2">
					<p className="text-body-sm font-medium text-text-primary">Tags</p>
					<div className="space-y-3">
						{(Object.keys(tagsByCategory) as Array<keyof typeof tagsByCategory>).map((category) => (
							<div key={category} className="space-y-2">
								<p className="text-xs uppercase tracking-wide text-text-tertiary">
									{categoryLabel(category)}
								</p>
								<div className="grid gap-2 sm:grid-cols-2">
									{tagsByCategory[category].map((tag) => {
										const checked = selectedTagIds.includes(tag.id);

										return (
											<label
												key={tag.id}
												className="flex items-center gap-2 rounded-md border border-border-default px-3 py-2 text-body-sm text-text-primary"
											>
												<input
													type="checkbox"
													checked={checked}
													onChange={(event) => {
														if (event.target.checked) {
															setSelectedTagIds((current) => [...current, tag.id]);
															return;
														}

														setSelectedTagIds((current) => current.filter((id) => id !== tag.id));
													}}
												/>
												{tag.name}
											</label>
										);
									})}
								</div>
							</div>
						))}
					</div>
					{getFieldErrors("tag_ids") ? (
						<p className="text-xs text-destructive">{getFieldErrors("tag_ids")?.join(" ")}</p>
					) : null}
				</div>

				{result.serverError ? (
					<p className="text-sm text-destructive">{result.serverError}</p>
				) : null}

				<p className="text-xs text-text-tertiary">
					All submissions are shared under{" "}
					<a
						href="https://creativecommons.org/publicdomain/zero/1.0/"
						target="_blank"
						rel="noreferrer"
						className="text-text-secondary underline underline-offset-2"
					>
						CC0 (public domain)
					</a>
					.
				</p>

				<Button type="submit" disabled={isPending}>
					{isPending ? "Submitting..." : "Submit config"}
				</Button>
			</form>

			{submittedSlug ? (
				<div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
					Thanks! Your config has been submitted for review. Generated slug:{" "}
					<strong>{submittedSlug}</strong>
				</div>
			) : null}
		</div>
	);
}
