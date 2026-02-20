"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

import { vote } from "@/actions/vote";
import { Button } from "@/components/ui/button";

interface VoteButtonProps {
	configId: string;
	toolId: string;
	toolName: string;
	count: number;
	userVoted: boolean;
	isLoggedIn: boolean;
}

export function VoteButton({
	configId,
	toolId,
	toolName,
	count,
	userVoted,
	isLoggedIn,
}: VoteButtonProps) {
	const [message, setMessage] = useState<string | null>(null);
	const [optimisticCount, setOptimisticCount] = useState(count);
	const [optimisticVoted, setOptimisticVoted] = useState(userVoted);

	const { execute, isPending } = useAction(vote, {
		onSuccess: ({ data }) => {
			if (!data) {
				return;
			}

			setOptimisticVoted(data.voted);
			setOptimisticCount(data.newCount);
		},
		onError: () => {
			setOptimisticVoted(userVoted);
			setOptimisticCount(count);
			setMessage("Something went wrong");
		},
	});

	useEffect(() => {
		setOptimisticCount(count);
	}, [count]);

	useEffect(() => {
		setOptimisticVoted(userVoted);
	}, [userVoted]);

	useEffect(() => {
		if (!message) {
			return;
		}

		const timer = window.setTimeout(() => {
			setMessage(null);
		}, 2000);

		return () => {
			window.clearTimeout(timer);
		};
	}, [message]);

	const handleVote = () => {
		if (!isLoggedIn) {
			setMessage("Sign in to vote");
			return;
		}

		const previousCount = optimisticCount;
		const previousVoted = optimisticVoted;
		const nextVoted = !previousVoted;
		const nextCount = nextVoted ? previousCount + 1 : Math.max(0, previousCount - 1);

		setOptimisticVoted(nextVoted);
		setOptimisticCount(nextCount);
		execute({ config_id: configId, tool_id: toolId });
	};

	return (
		<div className="space-y-1">
			<Button
				type="button"
				variant={optimisticVoted ? "default" : "outline"}
				size="sm"
				onClick={handleVote}
				disabled={isPending}
				aria-label={`Vote for ${toolName}`}
			>
				Works with {toolName} 👍 {optimisticCount}
			</Button>
			{message ? <p className="text-caption text-text-tertiary">{message}</p> : null}
		</div>
	);
}
