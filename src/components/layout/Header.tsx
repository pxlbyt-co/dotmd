import Image from "next/image";
import Link from "next/link";
import { Terminal } from "lucide-react";

import { LoginButton } from "@/components/auth/LoginButton";
import { MobileNav } from "@/components/layout/MobileNav";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Header() {
	return (
		<header className="sticky top-0 z-30 border-b border-border-default bg-bg-base/90 backdrop-blur-md supports-[backdrop-filter]:bg-bg-base/60">
			<div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="group flex items-center gap-2 transition-opacity duration-200 ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
					aria-label={SITE_NAME}
				>
					<Terminal className="h-5 w-5 text-accent-primary transition-transform group-hover:scale-110" />
					<span className="font-mono text-base font-bold tracking-tight text-text-primary">
						{SITE_NAME}
					</span>
				</Link>

				<div className="flex items-center gap-4">
					<nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="group relative rounded-md px-3 py-1.5 font-mono text-xs font-medium text-text-secondary transition-colors duration-200 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
							>
								<span className="text-accent-primary/0 transition-colors duration-200 group-hover:text-accent-primary/50 mr-1">
									/
								</span>
								{link.label.toLowerCase()}
							</Link>
						))}
					</nav>

					<div className="hidden h-4 w-px bg-border-default md:block" />

					<div className="hidden md:block">
						<LoginButton />
					</div>

					<MobileNav />
				</div>
			</div>
		</header>
	);
}
