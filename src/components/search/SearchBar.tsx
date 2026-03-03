"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildSearchUrl } from "@/lib/search";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  query?: string;
  variant?: "hero" | "compact";
  className?: string;
  placeholder?: string;
  label?: string;
  debounceMs?: number;
}

export function SearchBar({
  query = "",
  variant = "hero",
  className,
  placeholder = "Search configs...",
  label = "Search configs",
  debounceMs = 300,
}: SearchBarProps) {
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState(query);
  const lastNavigatedUrl = useRef(buildSearchUrl(query));

  useEffect(() => {
    setValue(query);
    lastNavigatedUrl.current = buildSearchUrl(query);
  }, [query]);

  const navigateToSearch = useCallback(
    (nextQuery: string) => {
      const nextUrl = buildSearchUrl(nextQuery);

      if (nextUrl === lastNavigatedUrl.current) {
        return;
      }

      lastNavigatedUrl.current = nextUrl;
      router.push(nextUrl);
    },
    [router],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigateToSearch(value);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debounceMs, navigateToSearch, value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(value);
  };

  const isHero = variant === "hero";

  return (
    <search
      className={cn(
        "relative w-full",
        isHero ? "mx-auto max-w-2xl" : "max-w-md",
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="group relative">
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>

        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-accent-primary",
            isHero ? "h-5 w-5" : "h-4 w-4",
          )}
        />

        <Input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className={cn(
            "font-mono border-border-default bg-bg-surface-0 pr-16 pl-12 text-text-primary placeholder:text-text-placeholder transition-all duration-200 focus-visible:border-accent-primary/50 focus-visible:ring-1 focus-visible:ring-accent-primary focus-visible:ring-offset-0",
            isHero
              ? "h-14 rounded-lg text-sm shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-border-strong hover:bg-bg-surface-1"
              : "h-10 rounded-md text-xs",
          )}
        />

        {!value.trim() && isHero ? (
          <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <kbd className="hidden h-6 items-center gap-1 rounded border border-border-default bg-bg-surface-1 px-2 font-mono text-[10px] font-medium text-text-tertiary sm:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        ) : null}

        {value.trim() ? (
          <Button
            type="button"
            variant="ghost"
            size={isHero ? "icon" : "icon-sm"}
            onClick={() => {
              setValue("");
              navigateToSearch("");
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-text-secondary hover:text-accent-primary hover:bg-transparent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </form>
    </search>
  );
}
