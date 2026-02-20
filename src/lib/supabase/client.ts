import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

export const createClient = () => {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl) {
		throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
	}

	if (!supabasePublishableKey) {
		throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
	}

	return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
};
