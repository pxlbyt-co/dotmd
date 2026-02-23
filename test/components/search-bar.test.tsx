import { beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const pushMock = mock((_url: string) => {});

mock.module("next/navigation", () => ({
	useRouter: () => ({
		push: pushMock,
	}),
}));

const { SearchBar } = await import("../../src/components/search/SearchBar");

describe("SearchBar", () => {
	beforeEach(() => {
		pushMock.mockReset();
	});

	test("debounces navigation and encodes trimmed query", async () => {
		render(<SearchBar debounceMs={5} />);

		const input = screen.getByLabelText("Search configs");
		fireEvent.change(input, { target: { value: "  next js  " } });

		await waitFor(() => {
			expect(pushMock).toHaveBeenCalledWith("/browse?q=next%20js");
		});
	});

	test("clear button resets query and navigates back to browse", async () => {
		render(<SearchBar query="agents" debounceMs={50} />);

		const input = screen.getByLabelText("Search configs") as HTMLInputElement;
		const clearButton = screen.getByRole("button", { name: "Clear search" });
		fireEvent.click(clearButton);

		expect(pushMock).toHaveBeenCalledWith("/browse");
		await waitFor(() => {
			expect(input.value).toBe("");
		});
	});

	test("does not re-navigate when query prop matches current URL state", async () => {
		render(<SearchBar query="cursor" debounceMs={5} />);

		await new Promise((resolve) => setTimeout(resolve, 20));

		expect(pushMock).not.toHaveBeenCalled();
	});
});
