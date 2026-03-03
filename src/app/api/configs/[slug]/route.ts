import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const resolvedParams = await params;
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("configs")
			.select("content")
			.eq("slug", resolvedParams.slug)
			.eq("status", "published")
			.single();

		if (error || !data) {
			return NextResponse.json({ error: "Config not found" }, { status: 404 });
		}

		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
