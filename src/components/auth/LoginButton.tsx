"use client";

import type { User } from "@supabase/supabase-js";
import { ChevronDown, Github } from "lucide-react";
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
        size="sm"
        className={cn(
          "group font-mono text-xs font-medium text-text-secondary bg-bg-surface-0 border-border-default transition-all duration-200 hover:bg-bg-surface-1 hover:text-text-primary hover:border-accent-primary/40 focus-visible:ring-1 focus-visible:ring-accent-primary",
          mergedClassName,
        )}
        onClick={() => {
          void handleSignIn();
        }}
      >
        <Github className="mr-2 h-3.5 w-3.5 opacity-70 group-hover:opacity-100 group-hover:text-accent-primary transition-all" />
        <span>[auth login]</span>
      </Button>
    );
  }

  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "group gap-2 font-mono text-xs border-border-default bg-bg-surface-0 hover:bg-bg-surface-1 hover:border-accent-primary/40 transition-all duration-200 focus-visible:ring-1 focus-visible:ring-accent-primary",
            mergedClassName,
          )}
        >
          {avatarUrl ? (
            // biome-ignore lint/performance/noImgElement: OAuth avatar URLs are remote and user-provided.
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-4 rounded-[4px] opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <span className="inline-flex size-4 items-center justify-center rounded-[4px] bg-bg-surface-3 text-[9px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
              {getInitial(user)}
            </span>
          )}
          <span className="max-w-28 truncate text-text-secondary group-hover:text-text-primary transition-colors">
            @{displayName.toLowerCase()}
          </span>
          <ChevronDown className="size-3 text-text-tertiary transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[8rem] rounded-md border border-border-default bg-bg-surface-1 font-mono p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      >
        <DropdownMenuItem
          className="cursor-pointer rounded-[4px] px-2 py-1.5 text-xs text-text-secondary transition-colors focus:bg-bg-surface-2 focus:text-accent-primary focus:outline-none"
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <span className="mr-2 text-accent-primary/50">&gt;</span>
          exit()
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
