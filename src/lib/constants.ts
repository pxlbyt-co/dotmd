export const REVALIDATE_INTERVALS = {
	homepage: 60,
	browse: 60,
	detail: 300,
	tools: 300,
	types: 300,
	tags: 300,
} as const;

export const RESERVED_SLUGS = [
	"browse",
	"tools",
	"types",
	"tags",
	"submit",
	"auth",
	"api",
	"about",
	"search",
	"sitemap.xml",
	"robots.txt",
	"favicon.ico",
	"opengraph-image",
	"twitter-image",
	"manifest.webmanifest",
] as const;

export const TAG_CATEGORIES = ["framework", "language", "use_case"] as const;

export const LICENSES = ["CC0", "MIT", "Apache-2.0"] as const;

export const SITE_NAME = "dotmd";
export const SITE_TAGLINE = "The ANYTHING.md directory for AI config files";
export const GITHUB_URL = "https://github.com/pxlbyt-co/dotmd";
export const NAV_LINKS = [
	{ href: "/browse", label: "Browse" },
	{ href: "/submit", label: "Submit" },
] as const;
