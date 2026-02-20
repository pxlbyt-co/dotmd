import { createSafeActionClient } from "next-safe-action";

import { createClient } from "@/lib/supabase/server";

export const actionClient = createSafeActionClient({
	handleServerError(error) {
		console.error("Action error:", error);
		return "Something went wrong";
	},
});

export const authActionClient = actionClient.use(async ({ next }) => {
	const supabase = await createClient();
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	if (error || !session) {
		throw new Error("Not authenticated");
	}

	return next({
		ctx: {
			supabase,
			user: session.user,
		},
	});
});
