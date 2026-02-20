import type { Database } from "@/lib/supabase/types";

type ConfigRow = Database["public"]["Tables"]["configs"]["Row"];
type ConfigInsert = Database["public"]["Tables"]["configs"]["Insert"];
type FileTypeRow = Database["public"]["Tables"]["file_types"]["Row"];
type TagRow = Database["public"]["Tables"]["tags"]["Row"];
type ToolRow = Database["public"]["Tables"]["tools"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type ConfigStatus = ConfigRow["status"];
export type TagCategory = TagRow["category"];
export type License = ConfigRow["license"];

type FileTypeSummary = Pick<FileTypeRow, "slug" | "name" | "description" | "default_path">;
type ToolSummary = Pick<ToolRow, "slug" | "name">;
type AuthorSummary = Pick<UserRow, "github_username" | "avatar_url">;
type TagSummary = Pick<TagRow, "slug" | "name" | "category">;

export interface ConfigWithRelations
	extends Pick<
		ConfigRow,
		| "id"
		| "slug"
		| "title"
		| "description"
		| "content"
		| "author_name"
		| "license"
		| "source_url"
		| "status"
		| "published_at"
	> {
	file_type: FileTypeSummary;
	author: AuthorSummary | null;
	tools: ToolSummary[];
	tags: TagSummary[];
	helpful_count: number;
	tool_votes: Array<{
		tool_slug: ToolSummary["slug"];
		tool_name: ToolSummary["name"];
		count: number;
	}>;
	total_votes: number;
}

export interface ConfigSearchResult
	extends Pick<ConfigRow, "id" | "slug" | "title" | "description" | "author_name"> {
	tools: ToolSummary[];
	tags: Array<Pick<TagRow, "slug" | "name">>;
	total_votes: number;
}

export interface ConfigSubmission
	extends Pick<ConfigInsert, "title" | "description" | "content" | "file_type_id"> {
	tool_ids: string[];
	tag_ids: string[];
	license: License;
}
