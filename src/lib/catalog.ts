import fileTypesData from "../../data/file-types.json";
import tagsData from "../../data/tags.json";
import toolsData from "../../data/tools.json";

export type ToolCatalogEntry = {
	id: string;
	slug: string;
	name: string;
	description: string;
	website_url: string;
};

export type TagCatalogEntry = {
	id: string;
	slug: string;
	name: string;
	category: "framework" | "language" | "use_case";
};

export type FileTypeCatalogEntry = {
	id: string;
	slug: string;
	name: string;
	description: string;
	default_path: string;
	sort_order: number;
	supported_tools: string[];
};

export const TOOLS = toolsData as ToolCatalogEntry[];
export const TAGS = tagsData as TagCatalogEntry[];
export const FILE_TYPES = fileTypesData as FileTypeCatalogEntry[];
