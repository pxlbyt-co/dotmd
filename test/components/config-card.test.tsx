import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

mock.module("next/link", () => ({
	default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

const { ConfigCard } = await import("../../src/components/configs/ConfigCard");

describe("ConfigCard", () => {
	test("renders tools, vote count, and hidden tool indicator", () => {
		render(
			<ConfigCard
				config={{
					id: "cfg-1",
					slug: "awesome-config",
					title: "Awesome Config",
					description: "A very useful setup",
					author_name: "arlo",
					file_type: { slug: "agents-md", name: "AGENTS.md" },
					tools: [
						{ slug: "cursor", name: "Cursor" },
						{ slug: "claude-code", name: "Claude Code" },
						{ slug: "copilot", name: "Copilot" },
						{ slug: "windsurf", name: "Windsurf" },
					],
					total_votes: 12,
				}}
			/>,
		);

		expect(screen.getByText("AGENTS.md")).toBeInTheDocument();
		expect(screen.getByText("12 votes")).toBeInTheDocument();
		expect(screen.getByText("Cursor")).toBeInTheDocument();
		expect(screen.getByText("Claude Code")).toBeInTheDocument();
		expect(screen.getByText("Copilot")).toBeInTheDocument();
		expect(screen.getByText("+1")).toBeInTheDocument();
		expect(screen.getByText("by arlo")).toBeInTheDocument();
		expect(screen.getByRole("link")).toHaveAttribute("href", "/awesome-config");
	});

	test("falls back file type label and hides vote text for zero votes", () => {
		render(
			<ConfigCard
				config={{
					id: "cfg-2",
					slug: "minimal-config",
					title: "Minimal Config",
					description: "Minimal",
					author_name: "justin",
					file_type: null,
					tools: [{ slug: "cursor", name: "Cursor" }],
					total_votes: 0,
				}}
			/>,
		);

		expect(screen.getByText("Config")).toBeInTheDocument();
		expect(screen.queryByText(/votes/)).toBeNull();
		expect(screen.queryByText("+1")).toBeNull();
	});
});
