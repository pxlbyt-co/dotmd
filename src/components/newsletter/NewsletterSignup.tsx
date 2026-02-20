"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";

import { subscribeAction } from "@/actions/subscribe";
import { Button } from "@/components/ui/button";

export function NewsletterSignup() {
	const formRef = useRef<HTMLFormElement>(null);
	const [subscribed, setSubscribed] = useState(false);

	const { execute, isExecuting, result } = useAction(subscribeAction, {
		onSuccess: () => {
			setSubscribed(true);
			formRef.current?.reset();
		},
	});

	if (subscribed) {
		return (
			<div className="rounded-xl border border-border-default bg-bg-surface-1 px-6 py-5 text-center">
				<p className="text-sm font-medium text-accent-primary">You&apos;re in! 🎉</p>
				<p className="mt-1 text-sm text-text-secondary">
					We&apos;ll let you know when new configs drop.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border-default bg-bg-surface-1 px-6 py-5">
			<p className="text-sm font-medium text-text-primary">Stay in the loop</p>
			<p className="mt-1 text-sm text-text-secondary">
				Get notified when new configs are published. No spam, unsubscribe anytime.
			</p>
			<form
				ref={formRef}
				className="mt-3 flex gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const email = formData.get("email") as string;
					if (email) {
						execute({ email });
					}
				}}
			>
				<input
					type="email"
					name="email"
					required
					placeholder="you@example.com"
					className="min-w-0 flex-1 rounded-lg border border-border-default bg-bg-surface-0 px-3 py-2 text-sm text-text-primary placeholder:text-text-placeholder focus-visible:border-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
					disabled={isExecuting}
				/>
				<Button type="submit" disabled={isExecuting} className="shrink-0">
					{isExecuting ? "..." : "Subscribe"}
				</Button>
			</form>
			{result.serverError ? (
				<p className="mt-2 text-xs text-red-400">{result.serverError}</p>
			) : null}
			{result.validationErrors?.email?._errors?.[0] ? (
				<p className="mt-2 text-xs text-red-400">{result.validationErrors.email._errors[0]}</p>
			) : null}
		</div>
	);
}
