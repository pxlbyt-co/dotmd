import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
	width: 180,
	height: 180,
};
export const contentType = "image/png";

// Image generation
export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				fontSize: 80,
				background: "#000000",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				color: "#38bdf8",
				borderRadius: "40px",
				border: "4px solid rgba(56, 189, 248, 0.3)",
				fontFamily: "monospace",
				fontWeight: 700,
			}}
		>
			&gt;_
		</div>,
		{
			...size,
		},
	);
}
