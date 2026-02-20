import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

type RevalidationBody = {
	type: "config_published";
	slug: string;
	file_type_slug: string | null;
	tool_slugs: string[];
	tag_slugs: string[];
};

function isValidBody(body: unknown): body is RevalidationBody {
	if (!body || typeof body !== "object") return false;

	const candidate = body as Record<string, unknown>;

	return (
		candidate.type === "config_published" &&
		typeof candidate.slug === "string" &&
		(candidate.file_type_slug === null || typeof candidate.file_type_slug === "string") &&
		Array.isArray(candidate.tool_slugs) &&
		candidate.tool_slugs.every((slug) => typeof slug === "string") &&
		Array.isArray(candidate.tag_slugs) &&
		candidate.tag_slugs.every((slug) => typeof slug === "string")
	);
}

export async function POST(request: NextRequest) {
	const secret = request.headers.get("x-revalidation-secret");
	const expectedSecret = process.env.REVALIDATION_SECRET;

	if (!secret || !expectedSecret || secret !== expectedSecret) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body: unknown = await request.json();

		if (!isValidBody(body)) {
			return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
		}

		const paths = [
			"/",
			"/browse",
			`/${body.slug}`,
			...body.tool_slugs.map((toolSlug) => `/tools/${toolSlug}`),
			...body.tag_slugs.map((tagSlug) => `/tags/${tagSlug}`),
			"/api/configs",
		];

		if (body.file_type_slug) {
			paths.push(`/types/${body.file_type_slug}`);
		}

		for (const path of paths) {
			revalidatePath(path);
		}

		return NextResponse.json({ revalidated: true, paths }, { status: 200 });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function GET() {
	return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function PUT() {
	return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function PATCH() {
	return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function DELETE() {
	return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function OPTIONS() {
	return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function HEAD() {
	return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
