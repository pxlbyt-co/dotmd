export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			email_subscribers: {
				Row: {
					id: string;
					email: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					email: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					created_at?: string;
				};
				Relationships: [];
			};
			anonymous_votes: {
				Row: {
					config_id: string;
					created_at: string | null;
					id: string;
					ip_hash: string;
				};
				Insert: {
					config_id: string;
					created_at?: string | null;
					id?: string;
					ip_hash: string;
				};
				Update: {
					config_id?: string;
					created_at?: string | null;
					id?: string;
					ip_hash?: string;
				};
				Relationships: [
					{
						foreignKeyName: "anonymous_votes_config_id_fkey";
						columns: ["config_id"];
						isOneToOne: false;
						referencedRelation: "configs";
						referencedColumns: ["id"];
					},
				];
			};
			config_tags: {
				Row: {
					config_id: string;
					tag_id: string;
				};
				Insert: {
					config_id: string;
					tag_id: string;
				};
				Update: {
					config_id?: string;
					tag_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "config_tags_config_id_fkey";
						columns: ["config_id"];
						isOneToOne: false;
						referencedRelation: "configs";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "config_tags_tag_id_fkey";
						columns: ["tag_id"];
						isOneToOne: false;
						referencedRelation: "tags";
						referencedColumns: ["id"];
					},
				];
			};
			config_tools: {
				Row: {
					config_id: string;
					tool_id: string;
				};
				Insert: {
					config_id: string;
					tool_id: string;
				};
				Update: {
					config_id?: string;
					tool_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "config_tools_config_id_fkey";
						columns: ["config_id"];
						isOneToOne: false;
						referencedRelation: "configs";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "config_tools_tool_id_fkey";
						columns: ["tool_id"];
						isOneToOne: false;
						referencedRelation: "tools";
						referencedColumns: ["id"];
					},
				];
			};
			configs: {
				Row: {
					author_id: string | null;
					author_name: string;
					content: string;
					created_at: string | null;
					description: string;
					file_type_id: string;
					id: string;
					license: "CC0" | "MIT" | "Apache-2.0";
					published_at: string | null;
					search_vector: unknown | null;
					slug: string;
					source_url: string | null;
					status: "pending" | "published" | "rejected";
					title: string;
					updated_at: string | null;
				};
				Insert: {
					author_id?: string | null;
					author_name: string;
					content: string;
					created_at?: string | null;
					description: string;
					file_type_id: string;
					id?: string;
					license?: "CC0" | "MIT" | "Apache-2.0";
					published_at?: string | null;
					search_vector?: never;
					slug: string;
					source_url?: string | null;
					status?: "pending" | "published" | "rejected";
					title: string;
					updated_at?: string | null;
				};
				Update: {
					author_id?: string | null;
					author_name?: string;
					content?: string;
					created_at?: string | null;
					description?: string;
					file_type_id?: string;
					id?: string;
					license?: "CC0" | "MIT" | "Apache-2.0";
					published_at?: string | null;
					search_vector?: never;
					slug?: string;
					source_url?: string | null;
					status?: "pending" | "published" | "rejected";
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "configs_author_id_fkey";
						columns: ["author_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "configs_file_type_id_fkey";
						columns: ["file_type_id"];
						isOneToOne: false;
						referencedRelation: "file_types";
						referencedColumns: ["id"];
					},
				];
			};
			file_types: {
				Row: {
					created_at: string | null;
					default_path: string | null;
					description: string | null;
					id: string;
					name: string;
					slug: string;
					sort_order: number | null;
				};
				Insert: {
					created_at?: string | null;
					default_path?: string | null;
					description?: string | null;
					id?: string;
					name: string;
					slug: string;
					sort_order?: number | null;
				};
				Update: {
					created_at?: string | null;
					default_path?: string | null;
					description?: string | null;
					id?: string;
					name?: string;
					slug?: string;
					sort_order?: number | null;
				};
				Relationships: [];
			};
			tags: {
				Row: {
					category: "framework" | "language" | "use_case";
					created_at: string | null;
					id: string;
					name: string;
					slug: string;
					sort_order: number | null;
				};
				Insert: {
					category: "framework" | "language" | "use_case";
					created_at?: string | null;
					id?: string;
					name: string;
					slug: string;
					sort_order?: number | null;
				};
				Update: {
					category?: "framework" | "language" | "use_case";
					created_at?: string | null;
					id?: string;
					name?: string;
					slug?: string;
					sort_order?: number | null;
				};
				Relationships: [];
			};
			tool_file_types: {
				Row: {
					file_type_id: string;
					tool_id: string;
				};
				Insert: {
					file_type_id: string;
					tool_id: string;
				};
				Update: {
					file_type_id?: string;
					tool_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "tool_file_types_file_type_id_fkey";
						columns: ["file_type_id"];
						isOneToOne: false;
						referencedRelation: "file_types";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "tool_file_types_tool_id_fkey";
						columns: ["tool_id"];
						isOneToOne: false;
						referencedRelation: "tools";
						referencedColumns: ["id"];
					},
				];
			};
			tools: {
				Row: {
					created_at: string | null;
					description: string | null;
					icon_slug: string | null;
					id: string;
					name: string;
					slug: string;
					sort_order: number | null;
					website_url: string | null;
				};
				Insert: {
					created_at?: string | null;
					description?: string | null;
					icon_slug?: string | null;
					id?: string;
					name: string;
					slug: string;
					sort_order?: number | null;
					website_url?: string | null;
				};
				Update: {
					created_at?: string | null;
					description?: string | null;
					icon_slug?: string | null;
					id?: string;
					name?: string;
					slug?: string;
					sort_order?: number | null;
					website_url?: string | null;
				};
				Relationships: [];
			};
			users: {
				Row: {
					avatar_url: string | null;
					bio: string | null;
					created_at: string | null;
					display_name: string;
					github_username: string;
					id: string;
				};
				Insert: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string | null;
					display_name: string;
					github_username: string;
					id: string;
				};
				Update: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string | null;
					display_name?: string;
					github_username?: string;
					id?: string;
				};
				Relationships: [];
			};
			votes: {
				Row: {
					config_id: string;
					created_at: string | null;
					id: string;
					tool_id: string;
					user_id: string;
				};
				Insert: {
					config_id: string;
					created_at?: string | null;
					id?: string;
					tool_id: string;
					user_id: string;
				};
				Update: {
					config_id?: string;
					created_at?: string | null;
					id?: string;
					tool_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "votes_config_id_fkey";
						columns: ["config_id"];
						isOneToOne: false;
						referencedRelation: "configs";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "votes_tool_id_fkey";
						columns: ["tool_id"];
						isOneToOne: false;
						referencedRelation: "tools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "votes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
