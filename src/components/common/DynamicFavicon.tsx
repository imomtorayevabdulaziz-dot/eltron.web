"use client";

import { useEffect } from "react";
import { useStore } from "@/store/store";

const ELTRON_ICON_URL = "/icons/eltron-favicon.png?v=eltron3";

function applyFavicon(url: string) {
    if (typeof document === "undefined") return;
    try {
        const existing = document.querySelectorAll("link[rel*='icon']");
        existing.forEach((el) => el.remove());

        const link = document.createElement("link");
        link.rel = "shortcut icon";
        link.type = "image/png";
        link.href = url;
        document.head.appendChild(link);

        const linkIcon = document.createElement("link");
        linkIcon.rel = "icon";
        linkIcon.type = "image/png";
        linkIcon.sizes = "120x120";
        linkIcon.href = url;
        document.head.appendChild(linkIcon);
    } catch (e) {
        console.error("Failed to update favicon:", e);
    }
}

/**
 * DynamicFavicon
 * Eltron rasmiy oltin emblemasidan foydalanadi va
 * savatda tovar bo'lsa jonli qizil nishon (live badge) chizadi.
 */
export default function DynamicFavicon() {
    const cart = useStore((state) => state.cart);
    const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Har doim birinchi bo'lib rasmiy oltin Eltron emblemasini o'rnatamiz
        if (cartCount === 0) {
            applyFavicon(ELTRON_ICON_URL);
            return;
        }

        // Savatda mahsulot bo'lsa, rasmiy oltin logotip ustiga jonli qizil nishon chizamiz
        const img = new Image();
        img.src = "/icons/eltron-favicon.png?v=eltron3";
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const size = 64;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // Rasm chizish
            ctx.drawImage(img, 0, 0, size, size);

            // Jonli Qizil Nishon (Cart Badge)
            const badgeRadius = 14;
            const badgeX = size - badgeRadius;
            const badgeY = badgeRadius;

            // Qora chegara
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius + 2, 0, Math.PI * 2);
            ctx.fillStyle = "#000000";
            ctx.fill();

            // Qizil nishon
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#EF4444";
            ctx.fill();

            // Soni
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(cartCount > 9 ? "9+" : cartCount.toString(), badgeX, badgeY + 0.5);

            applyFavicon(canvas.toDataURL("image/png"));
        };
    }, [cartCount]);

    return null;
}
