export function buildSearchUrl(query: string): string {
	const trimmedQuery = query.trim();

	if (!trimmedQuery) {
		return "/browse";
	}

	return `/browse?q=${encodeURIComponent(trimmedQuery)}`;
}
