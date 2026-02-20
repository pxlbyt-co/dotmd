"use client";

import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";

import { anonymousVote } from "@/actions/anonymous-vote";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "dotmd_helpful_votes";

function getVotedConfigs(): Set<string> {
	if (typeof window === "undefined") {
		return new Set();
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
	} catch {
		return new Set();
	}
}

function setVotedConfig(configId: string, voted: boolean) {
	try {
		const configs = getVotedConfigs();

		if (voted) {
			configs.add(configId);
		} else {
			configs.delete(configId);
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify([...configs]));
	} catch {
		// localStorage unavailable — degrade gracefully
	}
}

interface HelpfulButtonProps {
	configId: string;
	count: number;
}

export function HelpfulButton({ configId, count }: HelpfulButtonProps) {
	const [optimisticCount, setOptimisticCount] = useState(count);
	const [hasVoted, setHasVoted] = useState(false);

	// Hydrate voted state from localStorage after mount
	useEffect(() => {
		setHasVoted(getVotedConfigs().has(configId));
	}, [configId]);

	const { execute, isPending } = useAction(anonymousVote, {
		onSuccess: ({ data }) => {
			if (!data) {
				return;
			}

			setOptimisticCount(data.count);
			setHasVoted(data.voted);
			setVotedConfig(configId, data.voted);
		},
		onError: () => {
			// Revert optimistic update
			setOptimisticCount(count);
			setHasVoted(getVotedConfigs().has(configId));
		},
	});

	const handleVote = useCallback(() => {
		if (isPending) {
			return;
		}

		const nextVoted = !hasVoted;
		const nextCount = nextVoted ? optimisticCount + 1 : Math.max(0, optimisticCount - 1);

		setHasVoted(nextVoted);
		setOptimisticCount(nextCount);
		execute({ config_id: configId });
	}, [isPending, hasVoted, optimisticCount, configId, execute]);

	return (
		<div className="space-y-1">
			<Button
				type="button"
				variant={hasVoted ? "default" : "secondary"}
				size="sm"
				onClick={handleVote}
				disabled={isPending}
			>
				{hasVoted ? "Helpful" : "Mark helpful"} ({optimisticCount})
			</Button>
		</div>
	);
}
