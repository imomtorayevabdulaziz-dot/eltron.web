"use client";

import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store/store";
import { videoPreWarmer } from "@/lib/videoPreWarmer";
import { Language } from "@/types";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
    className?: string;
    variant?: "pill" | "compact";
}

export default function LanguageSwitcher({ className = "", variant = "pill" }: LanguageSwitcherProps) {
    const language = useStore(state => state.language);
    const setLanguage = useStore(state => state.setLanguage);
    const pathname = usePathname();
    const router = useRouter();

    const switchLanguage = (newLang: Language) => {
        if (newLang === language) return;
        videoPreWarmer.triggerHaptic("selection");
        setLanguage(newLang);

        if (typeof document !== "undefined") {
            document.cookie = `eltron_locale=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
            document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
        }

        // Replace /[lang] in current URL
        let newPath = pathname;
        if (newPath.startsWith("/uz") || newPath.startsWith("/ru")) {
            newPath = newPath.replace(/^\/(uz|ru)/, `/${newLang}`);
        } else {
            newPath = `/${newLang}${newPath === "/" ? "" : newPath}`;
        }
        const search = typeof window !== "undefined" ? window.location.search : "";
        router.push(newPath + search);
    };

    if (variant === "compact") {
        const nextLang: Language = language === "uz" ? "ru" : "uz";
        return (
            <button
                type="button"
                onClick={() => switchLanguage(nextLang)}
                className={`ios-tap-feedback active:scale-95 transition-all duration-150 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[rgba(230,184,62,0.45)] bg-white text-[11px] font-bold text-[#0F1410] shadow-sm hover:border-[#E6B83E] cursor-pointer shrink-0 ${className}`}
                title={language === "uz" ? "Rus tiliga o'tish" : "O'zbek tiliga o'tish"}
                aria-label="Tilni almashtirish"
            >
                <Globe size={13} color="#BC8D1A" />
                <span>{language.toUpperCase()}</span>
            </button>
        );
    }

    return (
        <div
            className={`inline-flex items-center p-0.5 rounded-full border border-[rgba(230,184,62,0.4)] bg-[#FDFBF7] shadow-sm select-none shrink-0 ${className}`}
            style={{ height: 32 }}
        >
            <button
                type="button"
                onClick={() => switchLanguage("uz")}
                className={`ios-tap-feedback active:scale-95 px-2.5 h-full rounded-full text-[11px] font-bold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    language === "uz"
                        ? "bg-[#0F1410] text-[#D4AF37] shadow-sm"
                        : "text-[#737D75] hover:text-[#0F1410]"
                }`}
            >
                UZ
            </button>
            <button
                type="button"
                onClick={() => switchLanguage("ru")}
                className={`ios-tap-feedback active:scale-95 px-2.5 h-full rounded-full text-[11px] font-bold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    language === "ru"
                        ? "bg-[#0F1410] text-[#D4AF37] shadow-sm"
                        : "text-[#737D75] hover:text-[#0F1410]"
                }`}
            >
                RU
            </button>
        </div>
    );
}
