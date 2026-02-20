"use server";

import crypto from "node:crypto";

import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { actionClient } from "./safe-action";

const uuidLike = z
	.string()
	.regex(
		/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
		"Invalid ID format",
	);

export const anonymousVote = actionClient
	.schema(
		z.object({
			config_id: uuidLike,
		}),
	)
	.action(async ({ parsedInput: { config_id } }) => {
		const headersList = await headers();
		const ip =
			headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
			headersList.get("x-real-ip") ??
			"127.0.0.1";

		const ip_hash = crypto.createHash("sha256").update(ip).digest("hex");
		const supabase = await createClient();

		// Toggle: if this IP already voted, remove the vote; otherwise add it
		const { data: existing } = await supabase
			.from("anonymous_votes")
			.select("id")
			.eq("config_id", config_id)
			.eq("ip_hash", ip_hash)
			.maybeSingle();

		let voted: boolean;

		if (existing) {
			await supabase.from("anonymous_votes").delete().eq("id", existing.id);
			voted = false;
		} else {
			await supabase.from("anonymous_votes").insert({ config_id, ip_hash });
			voted = true;
		}

		const { count } = await supabase
			.from("anonymous_votes")
			.select("*", { count: "exact", head: true })
			.eq("config_id", config_id);

		return { voted, count: count ?? 0 };
	});
