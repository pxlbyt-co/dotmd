"use server";

import { z } from "zod";

import { authActionClient } from "./safe-action";

export const vote = authActionClient
	.schema(
		z.object({
			config_id: z.string().uuid(),
			tool_id: z.string().uuid(),
		}),
	)
	.action(async ({ parsedInput: { config_id, tool_id }, ctx: { supabase, user } }) => {
		const { data: existing } = await supabase
			.from("votes")
			.select("id")
			.eq("user_id", user.id)
			.eq("config_id", config_id)
			.eq("tool_id", tool_id)
			.maybeSingle();

		if (existing) {
			await supabase.from("votes").delete().eq("id", existing.id);

			const { count } = await supabase
				.from("votes")
				.select("*", { count: "exact", head: true })
				.eq("config_id", config_id)
				.eq("tool_id", tool_id);

			return { voted: false, newCount: count ?? 0 };
		}

		await supabase.from("votes").insert({ user_id: user.id, config_id, tool_id });

		const { count } = await supabase
			.from("votes")
			.select("*", { count: "exact", head: true })
			.eq("config_id", config_id)
			.eq("tool_id", tool_id);

		return { voted: true, newCount: count ?? 0 };
	});
