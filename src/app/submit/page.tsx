import type { Metadata } from "next";
import Link from "next/link";

import { LoginButton } from "@/components/auth/LoginButton";
import { ConfigSubmitForm } from "@/components/configs/ConfigSubmitForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
	title: "Submit a config | dotmd",
	description: "Share your AI configuration file with the dotmd community.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function SubmitPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="mx-auto w-full max-w-md px-4 py-16 text-center sm:px-6 sm:py-24">
				<h1 className="text-h2 font-semibold text-text-primary">Sign in to submit</h1>
				<p className="mx-auto mt-3 max-w-sm text-body text-text-secondary">
					Connect your GitHub account to share config files with the community.
				</p>
				<div className="mt-8">
					<LoginButton />
				</div>
				<Link
					href="/"
					className="mt-6 inline-block text-sm text-text-tertiary hover:text-text-secondary"
				>
					← Back to home
				</Link>
			</div>
		);
	}

	const [fileTypesResult, toolsResult, tagsResult] = await Promise.all([
		supabase.from("file_types").select("id, name").order("sort_order", { ascending: true }),
		supabase.from("tools").select("id, name").order("sort_order", { ascending: true }),
		supabase
			.from("tags")
			.select("id, name, category")
			.order("category", { ascending: true })
			.order("sort_order", { ascending: true }),
	]);

	if (fileTypesResult.error || toolsResult.error || tagsResult.error) {
		throw new Error("Failed to load submission form options");
	}

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-6 space-y-2">
				<h1 className="text-h1 font-semibold text-text-primary">Submit a config</h1>
				<p className="max-w-3xl text-body text-text-secondary">
					Share your config with the community. Submissions are reviewed before publishing.
				</p>
			</div>

			<ConfigSubmitForm
				fileTypes={fileTypesResult.data}
				tools={toolsResult.data}
				tags={tagsResult.data}
			/>
		</div>
	);
}
