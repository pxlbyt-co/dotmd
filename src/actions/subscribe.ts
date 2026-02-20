"use server";

import { z } from "zod";

import { actionClient } from "@/actions/safe-action";
import { createClient } from "@/lib/supabase/server";

const subscribeSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export const subscribeAction = actionClient
	.schema(subscribeSchema)
	.action(async ({ parsedInput: { email } }) => {
		const supabase = await createClient();

		const { error } = await supabase
			.from("email_subscribers")
			.insert({ email: email.toLowerCase().trim() });

		if (error) {
			if (error.code === "23505") {
				// Unique constraint — already subscribed, treat as success
				return { success: true };
			}
			throw new Error("Unable to subscribe. Please try again.");
		}

		return { success: true };
	});
