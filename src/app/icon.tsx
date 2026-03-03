import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
	width: 32,
	height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				fontSize: 18,
				background: "#000000",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "#38bdf8",
				borderRadius: "6px",
				border: "2px solid rgba(56, 189, 248, 0.5)",
				fontFamily: "monospace",
				fontWeight: 700,
			}}
		>
			&gt;
		</div>,
		{
			...size,
		},
	);
}
