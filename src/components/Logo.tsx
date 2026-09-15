"use client";

import React from "react";

interface LogoProps {
    className?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    dark?: boolean;
    showSmile?: boolean;
    iconOnly?: boolean;
}

export default function Logo({
    className = "",
    size = "md",
    dark = false,
    showSmile = false,
    iconOnly = false,
}: LogoProps) {
    const heightClasses = {
        xs: "h-5 md:h-6",
        sm: "h-7 md:h-8",
        md: "h-9 md:h-11",
        lg: "h-12 md:h-14",
        xl: "h-20 md:h-24"
    };

    const iconSizes = {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-14 w-14",
        xl: "h-24 w-24"
    };

    if (iconOnly) {
        return (
            <img
                src="/logo-icon.png?v=eltron_gold"
                alt="Eltron"
                className={`${iconSizes[size]} object-contain select-none shrink-0 ${className}`}
            />
        );
    }

    return (
        <div className={`inline-flex items-center select-none ${className}`}>
            <img
                src="/logo.png?v=eltron_gold"
                alt="Eltron"
                className={`${heightClasses[size]} w-auto object-contain select-none shrink-0`}
            />
        </div>
    );
}
