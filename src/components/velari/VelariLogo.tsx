import { CSSProperties } from "react";

interface VelariLogoProps {
  size?: number;
  dark?: boolean;
  style?: CSSProperties;
}

const GREEN = "#2D6E3E";

export default function VelariLogo({ size = 32, dark = false, style = {} }: VelariLogoProps) {
  const fg = dark ? "#fff" : "#0F1410";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: Math.max(6, Math.round(size * 0.2)), ...style }}>
      <img
        src="/logo.png"
        alt="Eltron"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
      <span style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: size,
        fontWeight: 800,
        letterSpacing: -size * 0.04,
        color: fg,
        lineHeight: 1,
      }}>
        ELTRON<span style={{ color: "#D4AF37" }}>.</span>
      </span>
    </div>
  );
}
