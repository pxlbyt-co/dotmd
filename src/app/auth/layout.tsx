import type { Metadata } from "next";

import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
	alternates: {
		canonical: `${SITE_URL}/auth/callback`,
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return children;
}
