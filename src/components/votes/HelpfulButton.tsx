"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { anonymousVote } from "@/actions/anonymous-vote";
import { Button } from "@/components/ui/button";

interface HelpfulButtonProps {
	configId: string;
	count: number;
}

export function HelpfulButton({ configId, count }: HelpfulButtonProps) {
	const [optimisticCount, setOptimisticCount] = useState(count);
	const [hasVoted, setHasVoted] = useState(false);

	const { execute, isPending } = useAction(anonymousVote, {
		onSuccess: ({ data }) => {
			if (!data) {
				return;
			}

			setOptimisticCount(data.count);
			setHasVoted(true);
		},
		onError: () => {
			setOptimisticCount(count);
			setHasVoted(false);
		},
	});

	const handleVote = () => {
		if (hasVoted || isPending) {
			return;
		}

		setHasVoted(true);
		setOptimisticCount((currentCount) => currentCount + 1);
		execute({ config_id: configId });
	};

	return (
		<div className="space-y-1">
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={handleVote}
				disabled={hasVoted || isPending}
			>
				Mark helpful ({optimisticCount})
			</Button>
		</div>
	);
}
