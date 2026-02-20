import Link from "next/link";

import { GITHUB_URL, SITE_NAME } from "@/lib/constants";

export function Footer() {
	return (
		<footer className="border-t border-border-default bg-bg-surface-1">
			<div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-text-muted sm:flex-row sm:px-6 lg:px-8">
				<p>© 2026 {SITE_NAME}</p>
				<Link
					href={GITHUB_URL}
					target="_blank"
					rel="noreferrer"
					className="transition-colors duration-150 ease-in-out hover:text-accent-primary"
				>
					GitHub
				</Link>
			</div>
		</footer>
	);
}
