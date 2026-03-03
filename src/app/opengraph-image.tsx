import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = SITE_TAGLINE;
export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				background: "#000000",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				justifyContent: "space-between",
				padding: "80px",
				color: "#f8fafc",
				fontFamily: "monospace",
				border: "4px solid #111111",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#111111",
					padding: "16px 32px",
					borderRadius: "100px",
					border: "1px solid rgba(255, 255, 255, 0.12)",
				}}
			>
				<div
					style={{
						width: 12,
						height: 12,
						borderRadius: "50%",
						background: "#38bdf8",
						marginRight: 16,
					}}
				/>
				<span
					style={{
						fontSize: 24,
						color: "#94a3b8",
						textTransform: "uppercase",
						letterSpacing: "4px",
					}}
				>
					Registry Online
				</span>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
				<div style={{ display: "flex", alignItems: "center", gap: "24px", color: "#38bdf8" }}>
					<span style={{ fontSize: 80 }}>&gt;</span>
					<span style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-2px" }}>{SITE_NAME}</span>
				</div>

				<div style={{ fontSize: 40, color: "#94a3b8", maxWidth: "800px", lineHeight: 1.4 }}>
					{SITE_TAGLINE}
				</div>
			</div>

			<div
				style={{
					display: "flex",
					width: "100%",
					justifyContent: "space-between",
					alignItems: "flex-end",
					borderTop: "1px solid rgba(255,255,255,0.12)",
					paddingTop: "40px",
				}}
			>
				<div style={{ display: "flex", gap: "24px", fontSize: 28, color: "#64748b" }}>
					<span>{"// Browse"}</span>
					<span>{"// Copy"}</span>
					<span>{"// Remix"}</span>
				</div>
				<div
					style={{
						fontSize: 32,
						color: "#f8fafc",
						background: "rgba(56, 189, 248, 0.1)",
						border: "1px solid rgba(56, 189, 248, 0.3)",
						padding: "12px 24px",
						borderRadius: "8px",
					}}
				>
					.cursorrules
				</div>
			</div>
		</div>,
		{
			...size,
		},
	);
}
