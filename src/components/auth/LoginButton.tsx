"use client";

import type { User } from "@supabase/supabase-js";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LoginButtonProps = {
	className?: string;
};

const defaultClassName = "hidden md:inline-flex";

function getDisplayName(user: User) {
	const userName = user.user_metadata.user_name;
	if (typeof userName === "string" && userName.length > 0) {
		return userName;
	}

	const name = user.user_metadata.name;
	if (typeof name === "string" && name.length > 0) {
		return name;
	}

	return user.email ?? "Account";
}

function getAvatarUrl(user: User) {
	const avatarUrl = user.user_metadata.avatar_url;
	if (typeof avatarUrl === "string" && avatarUrl.length > 0) {
		return avatarUrl;
	}

	return null;
}

function getInitial(user: User) {
	const displayName = getDisplayName(user).trim();
	if (displayName.length > 0) {
		return displayName.charAt(0).toUpperCase();
	}

	return "U";
}

export function LoginButton({ className }: LoginButtonProps) {
	const router = useRouter();
	const [supabase] = useState(() => createClient());
	const [user, setUser] = useState<User | null>(null);

	const mergedClassName = className ?? defaultClassName;

	useEffect(() => {
		let isMounted = true;

		const hydrateUser = async () => {
			const {
				data: { user: sessionUser },
			} = await supabase.auth.getUser();

			if (isMounted) {
				setUser(sessionUser);
			}
		};

		void hydrateUser();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, [supabase]);

	const handleSignIn = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "github",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
	};

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.refresh();
	};

	if (!user) {
		return (
			<Button
				type="button"
				variant="outline"
				className={cn("text-text-primary", mergedClassName)}
				onClick={() => {
					void handleSignIn();
				}}
			>
				Sign in
			</Button>
		);
	}

	const displayName = getDisplayName(user);
	const avatarUrl = getAvatarUrl(user);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="outline" className={cn("gap-2", mergedClassName)}>
					{avatarUrl ? (
						// biome-ignore lint/performance/noImgElement: OAuth avatar URLs are remote and user-provided.
						<img src={avatarUrl} alt={displayName} className="size-6 rounded-full" />
					) : (
						<span className="inline-flex size-6 items-center justify-center rounded-full bg-bg-surface-3 text-xs font-semibold text-text-primary">
							{getInitial(user)}
						</span>
					)}
					<span className="max-w-28 truncate">{displayName}</span>
					<ChevronDown className="size-4 text-text-secondary" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onSelect={(event) => {
						event.preventDefault();
						void handleSignOut();
					}}
				>
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
