"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { LoginButton } from "@/components/auth/LoginButton";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";

export function MobileNav() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="md:hidden">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={() => setIsOpen((open) => !open)}
				aria-expanded={isOpen}
				aria-controls="mobile-navigation"
				className="text-text-primary transition-colors duration-150 ease-in-out hover:bg-bg-surface-2"
			>
				{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
				<span className="sr-only">Toggle navigation menu</span>
			</Button>
			{isOpen ? (
				<div
					id="mobile-navigation"
					className="absolute inset-x-0 top-full z-20 border-b border-border-default bg-bg-surface-1"
				>
					<div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setIsOpen(false)}
								className="rounded-md px-2 py-2 text-sm text-text-secondary transition-colors duration-150 ease-in-out hover:bg-bg-surface-2 hover:text-text-primary"
							>
								{link.label}
							</Link>
						))}
						<LoginButton className="w-full" />
					</div>
				</div>
			) : null}
		</div>
	);
}
