"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCategorySlug } from "@/lib/slugify";
import { getOptimizedImageUrl } from "@/lib/imageVariants";
import { videoPreWarmer } from "@/lib/videoPreWarmer";

interface FeaturedCat {
    id: string;
    name: string;
    name_uz?: string;
    name_ru?: string;
    image?: string;
    icon?: string;
    color?: string;
    image_meta?: any;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const PALETTE = [
    "#FFE0EC", "#E0E7FF", "#D1FAE5", "#FEF3C7",
    "#FCE7F3", "#DBEAFE", "#ECFDF5", "#FEF9C3",
    "#F3E8FF", "#CFFAFE", "#FEE2E2", "#E0F2FE",
];

export default function FeaturedCategories({ language, initial }: { language: "uz" | "ru"; initial?: FeaturedCat[] }) {
    const [categories, setCategories] = useState<FeaturedCat[]>(initial || []);
    // Server'dan tayyor ma'lumot kelsa, client-fetch (anon RLS yopiq) kerak emas.
    const [loading, setLoading] = useState(!initial);

    useEffect(() => {
        // Server prop bergan bo'lsa, qayta yuklamaymiz.
        if (initial) { setCategories(initial); setLoading(false); return; }

        const fetchFeatured = async () => {
            try {
                // 1) Settings'dan featured category ID lar ro'yxatini olish
                const { data: settingsRow } = await supabase
                    .from("settings")
                    .select("data")
                    .eq("id", "featured_categories")
                    .maybeSingle();

                const ids: string[] = settingsRow?.data?.category_ids || [];
                const showOnHome = settingsRow?.data?.show_on_home !== false;

                if (!showOnHome || ids.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2) Barcha kategoriyalar (daraxt) + tanlangan kategoriyalar ma'lumotlari
                const [{ data: allCats }, { data: prodCatRows }] = await Promise.all([
                    supabase.from("categories").select("id, parent_id").eq("is_deleted", false),
                    supabase.from("products").select("category_id").eq("is_deleted", false),
                ]);

                // Mahsuloti bor kategoriyalar (parentlar ham, agar subda mahsulot bo'lsa)
                const parentOf = new Map<string, string | null>(
                    (allCats || []).map((c: any) => [String(c.id), c.parent_id ? String(c.parent_id) : null])
                );
                const nonEmpty = new Set<string>();
                for (const r of (prodCatRows || [])) {
                    let cur: string | null | undefined = String((r as any).category_id || "");
                    while (cur) {
                        if (nonEmpty.has(cur)) break;
                        nonEmpty.add(cur);
                        cur = parentOf.get(cur) ?? null;
                    }
                }

                // Faqat mahsuloti bor tanlangan kategoriyalar (yoki boshlang'ich paytda barcha tanlanganlar)
                const visibleIds = nonEmpty.size === 0 ? ids : ids.filter(id => nonEmpty.has(String(id)));
                if (visibleIds.length === 0) { setLoading(false); return; }

                const { data: cats } = await supabase
                    .from("categories")
                    .select("id, name, name_uz, name_ru, image, icon, color, image_meta")
                    .in("id", visibleIds);

                if (cats) {
                    const sorted = visibleIds
                        .map(id => cats.find(c => String(c.id) === String(id)))
                        .filter(Boolean) as FeaturedCat[];
                    setCategories(sorted);
                }
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);

    // Sozlanmagan / yuklanayotgan paytda hech narsa ko'rsatmaymiz (skelet chiziqlar bo'lmasin).
    if (loading) return null;
    if (categories.length === 0) return null;

    const HeaderRow = ({ fontSize, mb }: { fontSize: number; mb: number }) => (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mb }}>
            <h2 style={{ fontSize, fontWeight: 800, color: "#0F1410", letterSpacing: -0.4, margin: 0 }}>
                {language === "uz" ? "Kategoriyalar" : "Категории"}
            </h2>
            <Link
                href={`/${language}/catalog`}
                style={{ fontSize: 14, fontWeight: 600, color: "#D4AF37", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}
            >
                {language === "uz" ? "Barchasi" : "Все"}
                <ChevronRight size={16} color="#D4AF37" />
            </Link>
        </div>
    );

    return (
        <>
            {/* ── MOBIL (Yonma-yon, kalt, yoniga cho'zilgan, yumaloq burchakli tugmalar) ── */}
            <div className="md:hidden" style={{ padding: "14px 20px 0" }}>
                <HeaderRow fontSize={18} mb={12} />
                {categories.length === 2 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                        {categories.map((cat) => {
                            const name = language === "uz" ? (cat.name_uz || cat.name) : (cat.name_ru || cat.name);
                            return (
                                <Link
                                    key={cat.id}
                                    href={`/${language}/catalog/${getCategorySlug(cat, language)}`}
                                    onClick={() => videoPreWarmer.triggerHaptic("light")}
                                    className="ios-tap-feedback active:scale-[0.96] transition-all duration-150 select-none will-change-transform flex items-center justify-between px-3 py-2.5 rounded-full relative overflow-hidden group shadow-sm"
                                    style={{
                                        background: "linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 100%)",
                                        border: "1.5px solid rgba(230,184,62,0.45)",
                                        boxShadow: "0 2px 10px rgba(230,184,62,0.12)",
                                        textDecoration: "none",
                                        height: 48,
                                    }}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div
                                            style={{
                                                width: 28, height: 28,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                overflow: "hidden", flexShrink: 0,
                                            }}
                                        >
                                            {cat.image ? (
                                                <img src={getOptimizedImageUrl(cat.image_meta, cat.image, 'xs')} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                                            ) : (cat.icon || "📦")}
                                        </div>
                                        <span style={{
                                            fontSize: 11.5, fontWeight: 700, color: "#0F1410", letterSpacing: -0.2,
                                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                        }}>
                                            {name}
                                        </span>
                                    </div>
                                    <ChevronRight size={14} color="#E6B83E" className="shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        style={{
                            display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none",
                            WebkitOverflowScrolling: "touch",
                        }}
                        className="no-scrollbar overscroll-x-contain touch-pan-x"
                    >
                        {categories.map((cat, idx) => {
                            const bg = cat.color || PALETTE[idx % PALETTE.length];
                            const name = language === "uz" ? (cat.name_uz || cat.name) : (cat.name_ru || cat.name);
                            return (
                                <Link
                                    key={cat.id}
                                    href={`/${language}/catalog/${getCategorySlug(cat, language)}`}
                                    onClick={() => videoPreWarmer.triggerHaptic("light")}
                                    className="ios-tap-feedback active:scale-90 transition-transform duration-150 ease-out select-none will-change-transform"
                                    style={{
                                        flexShrink: 0, display: "flex", flexDirection: "column",
                                        alignItems: "center", gap: 8, textDecoration: "none",
                                        WebkitTapHighlightColor: "transparent",
                                        animation: `velari-cart-in ${200 + idx * 60}ms ${EASE} both`,
                                    }}
                                >
                                    <div
                                        className="[contain:layout_paint]"
                                        style={{
                                            width: 64, height: 64, borderRadius: 20,
                                            background: cat.image ? "#fff" : bg,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 28, lineHeight: 1, overflow: "hidden",
                                            boxShadow: "0 4px 12px rgba(15,20,16,0.08)",
                                            transform: "translate3d(0, 0, 0)",
                                        }}
                                    >
                                        {cat.image ? (
                                            <img src={getOptimizedImageUrl(cat.image_meta, cat.image, 'xs')} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        ) : (cat.icon || "📦")}
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, color: "#0F1410", letterSpacing: -0.1,
                                        maxWidth: 72, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>{name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── DESKTOP (Yonma-yon, kalt, yoniga cho'zilgan, yumaloq burchakli tugmalar) ── */}
            <div className="hidden md:block px-10 mt-8">
                <HeaderRow fontSize={22} mb={14} />
                {categories.length === 2 ? (
                    <div className="grid grid-cols-2 gap-5">
                        {categories.map((cat) => {
                            const name = language === "uz" ? (cat.name_uz || cat.name) : (cat.name_ru || cat.name);
                            return (
                                <Link
                                    key={cat.id}
                                    href={`/${language}/catalog/${getCategorySlug(cat, language)}`}
                                    className="group ios-tap-feedback active:scale-[0.98] transition-all duration-200 will-change-transform flex items-center justify-between px-6 py-3 rounded-full border border-[#E6B83E]/45 hover:border-[#E6B83E] hover:shadow-lg shadow-sm"
                                    style={{
                                        background: "linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 100%)",
                                        textDecoration: "none",
                                        height: 54,
                                    }}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div
                                            style={{
                                                width: 34, height: 34,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                overflow: "hidden", flexShrink: 0,
                                            }}
                                            className="group-hover:scale-110 transition-transform duration-200"
                                        >
                                            {cat.image ? (
                                                <img src={getOptimizedImageUrl(cat.image_meta, cat.image, 'md')} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                                            ) : (cat.icon || "📦")}
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span style={{ fontSize: 15, fontWeight: 800, color: "#0F1410", letterSpacing: -0.2 }}>
                                                {name}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "#BC8D1A", background: "rgba(230,184,62,0.12)", padding: "2px 8px", borderRadius: 999 }}>
                                                8 {language === "uz" ? "toifa" : "категорий"}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: 30, height: 30, borderRadius: 15,
                                            background: "rgba(230,184,62,0.15)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                        className="group-hover:bg-[#0F1410] transition-colors duration-200"
                                    >
                                        <ChevronRight size={16} color="#BC8D1A" className="group-hover:text-[#FFF6BA] group-hover:translate-x-0.5 transition-all duration-200" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        style={{
                            display: "flex", gap: 22, overflowX: "auto", paddingBottom: 6,
                            WebkitOverflowScrolling: "touch",
                        }}
                        className="no-scrollbar overscroll-x-contain touch-pan-x"
                    >
                        {categories.map((cat, idx) => {
                            const bg = cat.color || PALETTE[idx % PALETTE.length];
                            const name = language === "uz" ? (cat.name_uz || cat.name) : (cat.name_ru || cat.name);
                            return (
                                <Link
                                    key={cat.id}
                                    href={`/${language}/catalog/${getCategorySlug(cat, language)}`}
                                    className="group ios-tap-feedback active:scale-95 transition-transform duration-150 ease-out will-change-transform"
                                    style={{
                                        flexShrink: 0, display: "flex", flexDirection: "column",
                                        alignItems: "center", gap: 12, textDecoration: "none",
                                        animation: `velari-cart-in ${200 + idx * 60}ms ${EASE} both`,
                                    }}
                                >
                                    <div
                                        className="group-hover:-translate-y-1 group-hover:shadow-xl transition-transform duration-200 transition-shadow duration-200 [contain:layout_paint]"
                                        style={{
                                            width: 104, height: 104, borderRadius: 32,
                                            background: cat.image ? "#fff" : bg,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 46, lineHeight: 1, overflow: "hidden",
                                            boxShadow: "0 6px 18px rgba(15,20,16,0.08)",
                                            transform: "translate3d(0, 0, 0)",
                                        }}
                                    >
                                        {cat.image ? (
                                            <img src={getOptimizedImageUrl(cat.image_meta, cat.image, 'xs')} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        ) : (cat.icon || "📦")}
                                    </div>
                                    <span style={{
                                        fontSize: 14, fontWeight: 700, color: "#0F1410", letterSpacing: -0.2,
                                        maxWidth: 112, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>{name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
