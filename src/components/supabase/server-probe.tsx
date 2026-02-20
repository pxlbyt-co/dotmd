import { createClient } from "@/lib/supabase/server";

/**
 * T-002 verification helper.
 *
 * This Server Component executes a simple read query through the server client.
 * It is intentionally not mounted in a page yet.
 */
export const SupabaseServerProbe = async () => {
	const supabase = await createClient();
	const { count } = await supabase.from("tools").select("id", { count: "exact", head: true });

	return <span data-supabase-server-probe>{count ?? 0}</span>;
};
