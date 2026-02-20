"use server";

import crypto from "node:crypto";

import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { actionClient } from "./safe-action";

export const anonymousVote = actionClient
	.schema(
		z.object({
			config_id: z.string().uuid(),
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

		await supabase
			.from("anonymous_votes")
			.upsert({ config_id, ip_hash }, { onConflict: "config_id,ip_hash", ignoreDuplicates: true });

		const { count } = await supabase
			.from("anonymous_votes")
			.select("*", { count: "exact", head: true })
			.eq("config_id", config_id);

		return { count: count ?? 0 };
	});
