"use server";

import crypto from "node:crypto";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { authActionClient } from "@/actions/safe-action";
import { RESERVED_SLUGS } from "@/lib/constants";

const uuidLike = z
	.string()
	.regex(
		/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
		"Invalid ID format",
	);

const submitConfigSchema = z.object({
	title: z.string().min(3).max(100),
	description: z.string().min(10).max(500),
	content: z.string().min(10).max(50_000),
	file_type_id: uuidLike,
	tool_ids: z.array(uuidLike).min(1),
	tag_ids: z.array(uuidLike).min(1),
});

function slugifyTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function generateSlug(title: string): string {
	const base = slugifyTitle(title);
	const hash = crypto
		.createHash("sha256")
		.update(title + Date.now())
		.digest("hex")
		.slice(0, 6);

	return `${base}-${hash}`;
}

export const submitConfig = authActionClient
	.schema(submitConfigSchema)
	.action(async ({ parsedInput, ctx: { supabase, user } }) => {
		const baseSlug = slugifyTitle(parsedInput.title);

		if (!baseSlug || RESERVED_SLUGS.includes(baseSlug as (typeof RESERVED_SLUGS)[number])) {
			return returnValidationErrors(submitConfigSchema, {
				title: {
					_errors: ["Title results in a reserved slug. Please choose a different title."],
				},
			});
		}

		const slug = generateSlug(parsedInput.title);

		if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
			return returnValidationErrors(submitConfigSchema, {
				title: {
					_errors: ["Generated slug is reserved. Please choose a different title."],
				},
			});
		}

		const { data: insertedConfig, error: insertError } = await supabase
			.from("configs")
			.insert({
				title: parsedInput.title,
				description: parsedInput.description,
				content: parsedInput.content,
				file_type_id: parsedInput.file_type_id,
				license: "CC0",
				author_id: user.id,
				author_name:
					typeof user.user_metadata.preferred_username === "string"
						? user.user_metadata.preferred_username
						: (user.email ?? "anonymous"),
				slug,
				status: "pending",
			})
			.select("id")
			.single();

		if (insertError || !insertedConfig) {
			throw new Error(insertError?.message ?? "Failed to create config");
		}

		const configId = insertedConfig.id;

		const { error: toolsError } = await supabase.from("config_tools").insert(
			parsedInput.tool_ids.map((toolId) => ({
				config_id: configId,
				tool_id: toolId,
			})),
		);

		if (toolsError) {
			throw new Error(toolsError.message);
		}

		const { error: tagsError } = await supabase.from("config_tags").insert(
			parsedInput.tag_ids.map((tagId) => ({
				config_id: configId,
				tag_id: tagId,
			})),
		);

		if (tagsError) {
			throw new Error(tagsError.message);
		}

		return {
			id: configId,
			slug,
			status: "pending" as const,
		};
	});
