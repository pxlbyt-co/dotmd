"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface CopyButtonProps {
	content: string;
}

export function CopyButton({ content }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return;
		}

		const timer = window.setTimeout(() => {
			setCopied(false);
		}, 2000);

		return () => {
			window.clearTimeout(timer);
		};
	}, [copied]);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(content);
		setCopied(true);
	};

	return (
		<Button type="button" size="sm" variant="outline" onClick={handleCopy}>
			{copied ? "Copied!" : "Copy"}
		</Button>
	);
}
