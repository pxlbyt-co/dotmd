import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
	throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabasePublishableKey) {
	throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export const updateSession = async (request: NextRequest) => {
	let response = NextResponse.next({
		request,
	});

	const supabase = createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value } of cookiesToSet) {
					request.cookies.set(name, value);
				}

				response = NextResponse.next({
					request,
				});

				for (const { name, value, options } of cookiesToSet) {
					response.cookies.set(name, value, options);
				}
			},
		},
	});

	await supabase.auth.getUser();

	return response;
};
