import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

type Tool = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	website_url: string;
	sort_order: number;
};

type Tag = {
	id: string;
	slug: string;
	name: string;
	category: "framework" | "language" | "use_case";
	sort_order: number;
};

type FileType = {
	id: string;
	slug: string;
	name: string;
	description: string;
	default_path: string;
	sort_order: number;
};

type Config = {
	id: string;
	slug: string;
	title: string;
	description: string;
	content: string;
	author_id: string;
	author_name: string;
	license: "CC0" | "MIT" | "Apache-2.0";
	source_url: string | null;
	status: "pending" | "published" | "rejected";
	published_at: string | null;
	created_at: string;
	file_type_id: string;
};

type ConfigTool = {
	config_id: string;
	tool_id: string;
};

type ConfigTag = {
	config_id: string;
	tag_id: string;
};

type Vote = {
	id: string;
	user_id: string;
	config_id: string;
	tool_id: string;
};

type AnonymousVote = {
	id: string;
	config_id: string;
	ip_hash: string;
};

type EmailSubscriber = {
	email: string;
};

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? "54321");

const FILE_TYPE_ID = "11111111-1111-4111-8111-111111111111";
const TOOL_ID = "22222222-2222-4222-8222-222222222222";
const TAG_ID = "33333333-3333-4333-8333-333333333333";
const CONFIG_ID = "44444444-4444-4444-8444-444444444444";

const user = {
	id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
	email: "tester@dotmd.local",
	user_metadata: { preferred_username: "tester" },
};

const db: {
	tools: Tool[];
	tags: Tag[];
	fileTypes: FileType[];
	configs: Config[];
	configTools: ConfigTool[];
	configTags: ConfigTag[];
	votes: Vote[];
	anonymousVotes: AnonymousVote[];
	emailSubscribers: EmailSubscriber[];
} = {
	tools: [
		{
			id: TOOL_ID,
			slug: "cursor",
			name: "Cursor",
			description: "Cursor IDE",
			website_url: "https://cursor.com",
			sort_order: 1,
		},
	],
	tags: [
		{
			id: TAG_ID,
			slug: "react",
			name: "React",
			category: "framework",
			sort_order: 1,
		},
	],
	fileTypes: [
		{
			id: FILE_TYPE_ID,
			slug: "agents-md",
			name: "AGENTS.md",
			description: "Agent instructions",
			default_path: "AGENTS.md",
			sort_order: 1,
		},
	],
	configs: [
		{
			id: CONFIG_ID,
			slug: "cursor-react-starter",
			title: "Cursor React Starter",
			description: "A starter config for Cursor + React projects.",
			content: "# Cursor React Starter\n\nYou are a pragmatic coding assistant.",
			author_id: user.id,
			author_name: "tester",
			license: "CC0",
			source_url: null,
			status: "published",
			published_at: "2026-02-23T00:00:00.000Z",
			created_at: "2026-02-23T00:00:00.000Z",
			file_type_id: FILE_TYPE_ID,
		},
	],
	configTools: [{ config_id: CONFIG_ID, tool_id: TOOL_ID }],
	configTags: [{ config_id: CONFIG_ID, tag_id: TAG_ID }],
	votes: [],
	anonymousVotes: [],
	emailSubscribers: [],
};

function json(
	res: import("node:http").ServerResponse,
	status: number,
	body: unknown,
	extraHeaders?: Record<string, string>,
) {
	res.writeHead(status, {
		"content-type": "application/json",
		...extraHeaders,
	});
	res.end(JSON.stringify(body));
}

function noContent(
	res: import("node:http").ServerResponse,
	status: number,
	extraHeaders?: Record<string, string>,
) {
	res.writeHead(status, extraHeaders);
	res.end();
}

function parseBody(req: import("node:http").IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];

		req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
		req.on("end", () => {
			if (chunks.length === 0) {
				resolve(null);
				return;
			}

			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch (error) {
				reject(error);
			}
		});
		req.on("error", reject);
	});
}

function eqValue(searchParams: URLSearchParams, key: string): string | null {
	const raw = searchParams.get(key);
	if (!raw?.startsWith("eq.")) {
		return null;
	}

	return raw.slice(3);
}

function applyRange<T>(rows: T[], req: import("node:http").IncomingMessage): T[] {
	const range = req.headers.range;
	if (typeof range !== "string") {
		const limit = Number.parseInt(new URL(req.url ?? "", "http://localhost").searchParams.get("limit") ?? "", 10);
		if (Number.isFinite(limit) && limit > 0) {
			return rows.slice(0, limit);
		}
		return rows;
	}

	const match = range.match(/(\d+)-(\d+)/);
	if (!match) {
		return rows;
	}

	const start = Number.parseInt(match[1], 10);
	const end = Number.parseInt(match[2], 10);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
		return rows;
	}

	return rows.slice(start, end + 1);
}

function fileTypeById(id: string) {
	return db.fileTypes.find((fileType) => fileType.id === id) ?? null;
}

function toolById(id: string) {
	return db.tools.find((tool) => tool.id === id) ?? null;
}

function tagById(id: string) {
	return db.tags.find((tag) => tag.id === id) ?? null;
}

function configById(id: string) {
	return db.configs.find((config) => config.id === id) ?? null;
}

function configToPublishedBaseRow(config: Config) {
	const fileType = fileTypeById(config.file_type_id);
	return {
		id: config.id,
		slug: config.slug,
		title: config.title,
		description: config.description,
		author_name: config.author_name,
		published_at: config.published_at,
		created_at: config.created_at,
		file_type: fileType
			? {
				slug: fileType.slug,
				name: fileType.name,
				default_path: fileType.default_path,
			}
			: null,
	};
}

function configToHomeRow(config: Config) {
	const fileType = fileTypeById(config.file_type_id);
	const tools = db.configTools
		.filter((relation) => relation.config_id === config.id)
		.map((relation) => toolById(relation.tool_id))
		.filter((tool): tool is Tool => Boolean(tool))
		.map((tool) => ({ tool: { slug: tool.slug, name: tool.name } }));
	const tags = db.configTags
		.filter((relation) => relation.config_id === config.id)
		.map((relation) => tagById(relation.tag_id))
		.filter((tag): tag is Tag => Boolean(tag))
		.map((tag) => ({ tag: { slug: tag.slug, name: tag.name } }));
	const helpfulCount = db.anonymousVotes.filter((vote) => vote.config_id === config.id).length;

	return {
		id: config.id,
		slug: config.slug,
		title: config.title,
		description: config.description,
		author_name: config.author_name,
		file_type: fileType
			? {
				slug: fileType.slug,
				name: fileType.name,
				default_path: fileType.default_path,
			}
			: null,
		tools,
		tags,
		helpful_count: [{ count: helpfulCount }],
	};
}

function configToBrowseRow(config: Config) {
	const fileType = fileTypeById(config.file_type_id);
	const configTools = db.configTools
		.filter((relation) => relation.config_id === config.id)
		.map((relation) => toolById(relation.tool_id))
		.filter((tool): tool is Tool => Boolean(tool))
		.map((tool) => ({ tools: { slug: tool.slug, name: tool.name } }));
	const configTags = db.configTags
		.filter((relation) => relation.config_id === config.id)
		.map((relation) => tagById(relation.tag_id))
		.filter((tag): tag is Tag => Boolean(tag))
		.map((tag) => ({ tags: { slug: tag.slug, name: tag.name, category: tag.category } }));
	const votes = db.votes
		.filter((vote) => vote.config_id === config.id)
		.map((vote) => ({ id: vote.id }));
	const anonymousVotes = db.anonymousVotes
		.filter((vote) => vote.config_id === config.id)
		.map((vote) => ({ id: vote.id }));

	return {
		id: config.id,
		slug: config.slug,
		title: config.title,
		description: config.description,
		author_name: config.author_name,
		published_at: config.published_at,
		file_types: fileType ? { slug: fileType.slug, name: fileType.name } : null,
		config_tools: configTools,
		config_tags: configTags,
		votes,
		anonymous_votes: anonymousVotes,
	};
}

function configToDetailRow(config: Config) {
	const fileType = fileTypeById(config.file_type_id);
	const tools = db.configTools
		.filter((relation) => relation.config_id === config.id)
		.map((relation) => {
			const tool = toolById(relation.tool_id);
			return {
				tool_id: relation.tool_id,
				tool: tool ? { slug: tool.slug, name: tool.name } : null,
			};
		});
	const tags = db.configTags
		.filter((relation) => relation.config_id === config.id)
		.map((relation) => {
			const tag = tagById(relation.tag_id);
			return {
				tag: tag
					? {
						slug: tag.slug,
						name: tag.name,
						category: tag.category,
					}
					: null,
			};
		});

	return {
		id: config.id,
		slug: config.slug,
		title: config.title,
		description: config.description,
		content: config.content,
		author_name: config.author_name,
		license: config.license,
		source_url: config.source_url,
		status: config.status,
		published_at: config.published_at,
		file_type: fileType
			? {
				slug: fileType.slug,
				name: fileType.name,
				description: fileType.description,
				default_path: fileType.default_path,
			}
			: null,
		author: {
			github_username: "tester",
			avatar_url: null,
		},
		tools,
		tags,
	};
}

function maybeSingleResponse(
	res: import("node:http").ServerResponse,
	rows: unknown[],
	acceptHeader: string | undefined,
) {
	if (!acceptHeader?.includes("application/vnd.pgrst.object+json")) {
		json(res, 200, rows);
		return;
	}

	if (rows.length === 0) {
		json(res, 200, null);
		return;
	}

	json(res, 200, rows[0]);
}

const server = createServer(async (req, res) => {
	try {
		const method = req.method ?? "GET";
		const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
		const path = url.pathname;

		if (path === "/health") {
			json(res, 200, { ok: true });
			return;
		}

		if (path === "/auth/v1/user" && method === "GET") {
			json(res, 200, user);
			return;
		}

		if (path === "/rest/v1/file_types" && method === "GET") {
			let rows = [...db.fileTypes];
			const slug = eqValue(url.searchParams, "slug");
			if (slug) {
				rows = rows.filter((row) => row.slug === slug);
			}

			const payload = rows.map((row) => ({
				id: row.id,
				slug: row.slug,
				name: row.name,
				description: row.description,
				default_path: row.default_path,
			}));

			maybeSingleResponse(res, payload, req.headers.accept);
			return;
		}

		if (path === "/rest/v1/tools") {
			if (method === "GET") {
				let rows = [...db.tools];
				const slug = eqValue(url.searchParams, "slug");
				if (slug) {
					rows = rows.filter((row) => row.slug === slug);
				}

				const payload = rows.map((row) => ({
					id: row.id,
					slug: row.slug,
					name: row.name,
					description: row.description,
					website_url: row.website_url,
				}));

				maybeSingleResponse(res, payload, req.headers.accept);
				return;
			}
		}

		if (path === "/rest/v1/tags" && method === "GET") {
			let rows = [...db.tags];
			const slug = eqValue(url.searchParams, "slug");
			if (slug) {
				rows = rows.filter((row) => row.slug === slug);
			}

			const payload = rows.map((row) => ({
				id: row.id,
				slug: row.slug,
				name: row.name,
				category: row.category,
			}));

			maybeSingleResponse(res, payload, req.headers.accept);
			return;
		}

		if (path === "/rest/v1/configs") {
			if (method === "GET") {
				let rows = [...db.configs];
				const status = eqValue(url.searchParams, "status");
				const slug = eqValue(url.searchParams, "slug");
				if (status) {
					rows = rows.filter((row) => row.status === status);
				}
				if (slug) {
					rows = rows.filter((row) => row.slug === slug);
				}

				rows.sort((a, b) => {
					const first = new Date(b.published_at ?? b.created_at).getTime();
					const second = new Date(a.published_at ?? a.created_at).getTime();
					return first - second;
				});

				rows = applyRange(rows, req);

				const select = url.searchParams.get("select") ?? "";
				let payload: unknown[];
				if (select.includes("helpful_count:anonymous_votes")) {
					payload = rows.map(configToHomeRow);
				} else if (select.includes("config_tools(tools") || select.includes("config_tags(tags")) {
					payload = rows.map(configToBrowseRow);
				} else if (select.includes("author:users") || select.includes("tool_id, tool:tools")) {
					payload = rows.map(configToDetailRow);
				} else {
					payload = rows.map(configToPublishedBaseRow);
				}

				maybeSingleResponse(res, payload, req.headers.accept);
				return;
			}

			if (method === "POST") {
				const body = (await parseBody(req)) as Partial<Config> | null;
				if (!body || typeof body !== "object") {
					json(res, 400, { message: "Invalid payload" });
					return;
				}

				const inserted: Config = {
					id: randomUUID(),
					title: body.title ?? "Untitled",
					description: body.description ?? "",
					content: body.content ?? "",
					author_id: body.author_id ?? user.id,
					author_name: body.author_name ?? "anonymous",
					file_type_id: body.file_type_id ?? db.fileTypes[0].id,
					license: body.license ?? "CC0",
					source_url: body.source_url ?? null,
					status: body.status ?? "pending",
					slug: body.slug ?? `generated-${randomUUID().slice(0, 6)}`,
					published_at: body.published_at ?? null,
					created_at: new Date().toISOString(),
				};

				db.configs.push(inserted);
				maybeSingleResponse(res, [{ id: inserted.id }], req.headers.accept);
				return;
			}
		}

		if (path === "/rest/v1/config_tools") {
			if (method === "GET") {
				const select = url.searchParams.get("select") ?? "";

				if (select.includes("config:configs!inner(status)")) {
					let rows = db.configTools.map((relation) => ({
						tool: toolById(relation.tool_id)
							? { slug: toolById(relation.tool_id)?.slug }
							: null,
						config: configById(relation.config_id)
							? { status: configById(relation.config_id)?.status }
							: null,
					}));

					const requiredStatus = eqValue(url.searchParams, "config.status");
					if (requiredStatus) {
						rows = rows.filter((row) => row.config?.status === requiredStatus);
					}

					json(res, 200, rows);
					return;
				}

				const rows = db.configTools.map((relation) => ({
					config_id: relation.config_id,
					tool: toolById(relation.tool_id)
						? {
							slug: toolById(relation.tool_id)?.slug,
							name: toolById(relation.tool_id)?.name,
						}
						: null,
				}));
				json(res, 200, rows);
				return;
			}

			if (method === "POST") {
				const body = (await parseBody(req)) as ConfigTool[] | ConfigTool | null;
				const rows = Array.isArray(body) ? body : body ? [body] : [];
				for (const row of rows) {
					db.configTools.push({ config_id: row.config_id, tool_id: row.tool_id });
				}
				json(res, 201, rows);
				return;
			}
		}

		if (path === "/rest/v1/config_tags") {
			if (method === "GET") {
				const rows = db.configTags.map((relation) => ({
					config_id: relation.config_id,
					tag: tagById(relation.tag_id)
						? {
							slug: tagById(relation.tag_id)?.slug,
							name: tagById(relation.tag_id)?.name,
							category: tagById(relation.tag_id)?.category,
						}
						: null,
				}));
				json(res, 200, rows);
				return;
			}

			if (method === "POST") {
				const body = (await parseBody(req)) as ConfigTag[] | ConfigTag | null;
				const rows = Array.isArray(body) ? body : body ? [body] : [];
				for (const row of rows) {
					db.configTags.push({ config_id: row.config_id, tag_id: row.tag_id });
				}
				json(res, 201, rows);
				return;
			}
		}

		if (path === "/rest/v1/email_subscribers" && method === "POST") {
			const body = (await parseBody(req)) as { email?: string } | null;
			const email = body?.email ?? "";
			const exists = db.emailSubscribers.some((subscriber) => subscriber.email === email);
			if (exists) {
				json(res, 409, {
					code: "23505",
					message: "duplicate key value violates unique constraint",
				});
				return;
			}

			db.emailSubscribers.push({ email });
			json(res, 201, [{ email }]);
			return;
		}

		if (path === "/rest/v1/votes") {
			const configId = eqValue(url.searchParams, "config_id");
			const toolId = eqValue(url.searchParams, "tool_id");
			const userId = eqValue(url.searchParams, "user_id");
			const id = eqValue(url.searchParams, "id");

			let rows = [...db.votes];
			if (configId) rows = rows.filter((row) => row.config_id === configId);
			if (toolId) rows = rows.filter((row) => row.tool_id === toolId);
			if (userId) rows = rows.filter((row) => row.user_id === userId);
			if (id) rows = rows.filter((row) => row.id === id);

			if (method === "HEAD") {
				noContent(res, 200, {
					"content-range": `0-0/${rows.length}`,
				});
				return;
			}

			if (method === "GET") {
				const select = url.searchParams.get("select") ?? "*";
				if (select === "id") {
					maybeSingleResponse(
						res,
						rows.map((row) => ({ id: row.id })),
						req.headers.accept,
					);
					return;
				}

				const payload = rows.map((row) => ({ tool_id: row.tool_id, id: row.id }));
				json(res, 200, payload, { "content-range": `0-0/${rows.length}` });
				return;
			}

			if (method === "POST") {
				const body = (await parseBody(req)) as Omit<Vote, "id"> | null;
				if (!body) {
					json(res, 400, { message: "Invalid payload" });
					return;
				}

				const inserted: Vote = {
					id: randomUUID(),
					user_id: body.user_id,
					config_id: body.config_id,
					tool_id: body.tool_id,
				};
				db.votes.push(inserted);
				json(res, 201, [inserted]);
				return;
			}

			if (method === "DELETE") {
				db.votes = db.votes.filter((row) => {
					if (id) {
						return row.id !== id;
					}
					if (configId) {
						return row.config_id !== configId;
					}
					return true;
				});
				json(res, 200, []);
				return;
			}
		}

		if (path === "/rest/v1/anonymous_votes") {
			const configId = eqValue(url.searchParams, "config_id");
			const ipHash = eqValue(url.searchParams, "ip_hash");
			const id = eqValue(url.searchParams, "id");

			let rows = [...db.anonymousVotes];
			if (configId) rows = rows.filter((row) => row.config_id === configId);
			if (ipHash) rows = rows.filter((row) => row.ip_hash === ipHash);
			if (id) rows = rows.filter((row) => row.id === id);

			if (method === "HEAD") {
				noContent(res, 200, {
					"content-range": `0-0/${rows.length}`,
				});
				return;
			}

			if (method === "GET") {
				const select = url.searchParams.get("select") ?? "*";
				if (select === "id") {
					maybeSingleResponse(
						res,
						rows.map((row) => ({ id: row.id })),
						req.headers.accept,
					);
					return;
				}

				json(
					res,
					200,
					rows.map((row) => ({ id: row.id })),
					{ "content-range": `0-0/${rows.length}` },
				);
				return;
			}

			if (method === "POST") {
				const body = (await parseBody(req)) as Omit<AnonymousVote, "id"> | null;
				if (!body) {
					json(res, 400, { message: "Invalid payload" });
					return;
				}

				const inserted: AnonymousVote = {
					id: randomUUID(),
					config_id: body.config_id,
					ip_hash: body.ip_hash,
				};
				db.anonymousVotes.push(inserted);
				json(res, 201, [inserted]);
				return;
			}

			if (method === "DELETE") {
				db.anonymousVotes = db.anonymousVotes.filter((row) => {
					if (id) {
						return row.id !== id;
					}
					if (configId) {
						return row.config_id !== configId;
					}
					return true;
				});
				json(res, 200, []);
				return;
			}
		}

		json(res, 404, { message: `Not found: ${method} ${path}` });
	} catch (error) {
		console.error("[mock-supabase] request failed", error);
		json(res, 500, { message: "mock server error" });
	}
});

server.listen(PORT, () => {
	console.log(`[mock-supabase] listening on http://127.0.0.1:${PORT}`);
});
