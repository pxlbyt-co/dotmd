import Image from "next/image";
import Link from "next/link";

import { LoginButton } from "@/components/auth/LoginButton";
import { MobileNav } from "@/components/layout/MobileNav";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Header() {
	return (
		<header className="sticky top-0 z-30 border-b border-border-default bg-bg-surface-1/95 backdrop-blur supports-[backdrop-filter]:bg-bg-surface-1/80">
			<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="flex items-center transition-opacity duration-150 ease-in-out hover:opacity-80"
					aria-label={SITE_NAME}
				>
					<Image
						src="/logo.png"
						alt={SITE_NAME}
						width={60}
						height={40}
						className="h-10 w-auto"
						priority
					/>
				</Link>

				<div className="flex items-center gap-2">
					<nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="rounded-md px-3 py-2 text-sm text-text-secondary transition-colors duration-150 ease-in-out hover:bg-bg-surface-2 hover:text-text-primary"
							>
								{link.label}
							</Link>
						))}
					</nav>

					<LoginButton />

					<MobileNav />
				</div>
			</div>
		</header>
	);
}
