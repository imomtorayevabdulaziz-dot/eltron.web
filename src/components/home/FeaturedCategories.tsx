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
            {/* ── MOBIL (Apple 2-card showcase) ── */}
            <div className="md:hidden" style={{ padding: "16px 20px 0" }}>
                <HeaderRow fontSize={18} mb={14} />
                {categories.length === 2 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat) => {
                            const name = language === "uz" ? (cat.name_uz || cat.name) : (cat.name_ru || cat.name);
                            const subtitle = cat.id === 'telefon-aksessuarlari'
                                ? (language === "uz" ? "Zaryadka, kabel, chexol..." : "Зарядки, кабели, чехлы...")
                                : (language === "uz" ? "Sichqoncha, klaviatura..." : "Мыши, клавиатуры...");
                            return (
                                <Link
                                    key={cat.id}
                                    href={`/${language}/catalog/${getCategorySlug(cat, language)}`}
                                    onClick={() => videoPreWarmer.triggerHaptic("light")}
                                    className="ios-tap-feedback active:scale-[0.97] transition-all duration-200 select-none will-change-transform flex flex-col justify-between p-3.5 rounded-2xl relative overflow-hidden"
                                    style={{
                                        background: "linear-gradient(145deg, #FFFFFF 0%, #FAF6EE 100%)",
                                        border: "1px solid rgba(212,175,55,0.24)",
                                        boxShadow: "0 4px 18px rgba(212,175,55,0.08)",
                                        textDecoration: "none",
                                        minHeight: 146,
                                    }}
                                >
                                    <div className="flex items-start justify-between w-full">
                                        <div
                                            style={{
                                                width: 52, height: 52, borderRadius: 16,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {cat.image ? (
                                                <img src={getOptimizedImageUrl(cat.image_meta, cat.image, 'xs')} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                                            ) : (cat.icon || "📦")}
                                        </div>
                                        <div style={{
                                            fontSize: 10, fontWeight: 700, color: "#9E7719",
                                            background: "rgba(212,175,55,0.12)", padding: "3px 7px", borderRadius: 8,
                                        }}>
                                            8 {language === "uz" ? "toifa" : "категорий"}
                                        </div>
                                    </div>
                                    <div className="mt-2.5">
                                        <h3 style={{ fontSize: 13.5, fontWeight: 800, color: "#0F1410", lineHeight: 1.25, margin: 0 }}>
                                            {name}
                                        </h3>
                                        <p style={{ fontSize: 10.5, color: "#7A7265", margin: "4px 0 0", lineHeight: 1.2 }}>
                                            {subtitle}
                                        </p>
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#B8860B", display: "flex", alignItems: "center", gap: 3, marginTop: 8 }}>
                                        <span>{language === "uz" ? "Tanlash" : "Выбрать"}</span>
                                        <ChevronRight size={13} color="#B8860B" />
                                    </div>
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

            {/* ── DESKTOP (Apple 2-card showcase) ── */}
            <div className="hidden md:block px-10 mt-10">
                <HeaderRow fontSize={26} mb={20} />
                {categories.length === 2 ? (
                    <div className="grid grid-cols-2 gap-6">
                        {categories.map((cat) => {
                            const name = language === "uz" ? (cat.name_uz || cat.name) : (cat.name_ru || cat.name);
                            const subtitle = cat.id === 'telefon-aksessuarlari'
                                ? (language === "uz" ? "Zaryadlovchi qurilmalar, kabellar, naushniklar, chexollar, himoya oynalari va quvvatlagichlar" : "Зарядные устройства, кабели, наушники, чехлы, защитные стекла и повербанки")
                                : (language === "uz" ? "Sichqonchalar, mexanik klaviaturalar, o'yin kovriklari, USB-xablar va xotira qurilmalari" : "Мыши, механические клавиатуры, коврики, USB-хабы и накопители");
                            return (
                                <Link
                                    key={cat.id}
                                    href={`/${language}/catalog/${getCategorySlug(cat, language)}`}
                                    className="group ios-tap-feedback active:scale-[0.99] transition-all duration-200 will-change-transform flex items-center justify-between p-6 rounded-[28px] border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 hover:shadow-xl hover:-translate-y-1"
                                    style={{
                                        background: "linear-gradient(135deg, #FFFFFF 0%, #FAF6EE 100%)",
                                        boxShadow: "0 8px 32px rgba(212,175,55,0.08)",
                                        textDecoration: "none",
                                    }}
                                >
                                    <div className="flex items-center gap-5">
                                        <div
                                            style={{
                                                width: 80, height: 80, borderRadius: 24,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                overflow: "hidden", flexShrink: 0,
                                            }}
                                            className="group-hover:scale-105 transition-transform duration-200"
                                        >
                                            {cat.image ? (
                                                <img src={getOptimizedImageUrl(cat.image_meta, cat.image, 'md')} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                                            ) : (cat.icon || "📦")}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: "#9E7719", textTransform: "uppercase", letterSpacing: 0.8 }}>
                                                ✨ {language === "uz" ? "8 ta toifa mavjud" : "8 категорий доступно"}
                                            </div>
                                            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F1410", letterSpacing: -0.3, margin: "3px 0 0" }}>
                                                {name}
                                            </h3>
                                            <p style={{ fontSize: 13, color: "#7A7265", margin: "6px 0 0", maxWidth: 360, lineHeight: 1.35 }}>
                                                {subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            width: 44, height: 44, borderRadius: 22,
                                            background: "#0F1410", color: "#D4AF37",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, marginLeft: 16,
                                            boxShadow: "0 4px 14px rgba(15,20,16,0.15)",
                                        }}
                                        className="group-hover:translate-x-1 transition-transform duration-200"
                                    >
                                        <ChevronRight size={22} color="#D4AF37" />
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
