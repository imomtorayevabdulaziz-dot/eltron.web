"use client";

import { useEffect } from "react";
import { useStore } from "@/store/store";

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

        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement("link");
            link.rel = "shortcut icon";
            document.head.appendChild(link);
        }

        // Agar savat bo'sh bo'lsa, to'g'ridan-to'g'ri haqiqiy Eltron oltin emblemasini qo'yamiz
        if (cartCount === 0) {
            link.href = "/favicon-120x120.png?v=eltron2";
            link.type = "image/png";
            return;
        }

        // Savatda mahsulot bo'lsa, rasmiy oltin logotip ustiga qizil badge chizamiz
        const img = new Image();
        img.src = "/favicon-120x120.png";
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

            if (link) {
                link.href = canvas.toDataURL("image/png");
            }
        };
    }, [cartCount]);

    return null;
}
