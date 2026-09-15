"use client";

import React from "react";

interface LogoProps {
    className?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    dark?: boolean;
    showSmile?: boolean;
}

export default function Logo({ className = "", size = "md", dark = false }: LogoProps) {
    const sizeClasses = {
        xs: "text-lg",
        sm: "text-xl",
        md: "text-2xl",
        lg: "text-4xl",
        xl: "text-[140px]"
    };

    const dotSizes = {
        xs: "text-sm",
        sm: "text-base",
        md: "text-xl",
        lg: "text-3xl",
        xl: "text-[100px]"
    };

    const imgSizes = {
        xs: "h-6 w-6",
        sm: "h-7 w-7",
        md: "h-9 w-9",
        lg: "h-12 w-12",
        xl: "h-28 w-28"
    };

    const textColor = dark ? "text-white" : "text-[#0F1410]";

    return (
        <div className={`flex items-center gap-2 select-none ${className}`}>
            <img
                src="/logo.png"
                alt="Eltron"
                className={`${imgSizes[size]} object-contain shrink-0 select-none`}
            />
            <span className={`font-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif] font-black tracking-tight leading-none ${textColor} flex items-baseline`}>
                <span className={sizeClasses[size]}>ELTRON</span>
                <span className={`text-[#D4AF37] font-black ${dotSizes[size]}`} style={{ verticalAlign: 'baseline', position: 'relative', top: size === 'xl' ? '8px' : '2px' }}>.</span>
            </span>
        </div>
    );
}
