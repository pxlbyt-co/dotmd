"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * T-002 verification helper.
 *
 * This Client Component executes a simple read query through the browser client.
 * It is intentionally not mounted in a page yet.
 */
export const SupabaseBrowserProbe = () => {
	const [toolCount, setToolCount] = useState<number | null>(null);

	useEffect(() => {
		const supabase = createClient();

		void supabase
			.from("tools")
			.select("id", { count: "exact", head: true })
			.then(({ count }) => {
				setToolCount(count ?? 0);
			});
	}, []);

	return <span data-supabase-browser-probe>{toolCount ?? "…"}</span>;
};
