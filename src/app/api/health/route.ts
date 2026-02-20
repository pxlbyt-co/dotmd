import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
	const timestamp = new Date().toISOString();

	try {
		const supabase = await createClient();
		const { error } = await supabase.from("file_types").select("id").limit(1);

		if (error) {
			return NextResponse.json(
				{
					status: "degraded",
					db: "error",
					timestamp,
				},
				{ status: 200 },
			);
		}

		return NextResponse.json(
			{
				status: "ok",
				db: "connected",
				timestamp,
			},
			{ status: 200 },
		);
	} catch {
		return NextResponse.json(
			{
				status: "degraded",
				db: "error",
				timestamp,
			},
			{ status: 200 },
		);
	}
}
