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
				className="text-text-secondary transition-colors duration-200 ease-out hover:bg-bg-surface-1 hover:text-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary"
			>
				{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
				<span className="sr-only">Toggle navigation menu</span>
			</Button>
			{isOpen ? (
				<div
					id="mobile-navigation"
					className="absolute inset-x-0 top-full z-20 border-b border-border-default bg-bg-surface-0 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
				>
					<div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
						<div className="mb-2 px-2">
							<span className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary">
								{"// Navigation"}
							</span>
						</div>
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setIsOpen(false)}
								className="group flex items-center rounded-md px-2 py-2.5 font-mono text-sm font-medium text-text-secondary transition-all duration-200 ease-out hover:bg-bg-surface-1 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
							>
								<span className="mr-2 text-accent-primary/40 transition-colors group-hover:text-accent-primary">
									&gt;
								</span>
								{link.label.toLowerCase()}
							</Link>
						))}
						<div className="my-2 h-px w-full bg-border-subtle" />
						<div className="px-2 pt-1">
							<LoginButton className="w-full justify-start font-mono text-xs" />
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
