import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    const lang = params.lang === "ru" ? "ru" : "uz";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://eltron-web.vercel.app';
    const title = lang === "ru" 
        ? "Reels | Короткие видео и обзоры товаров — Eltron" 
        : "Reels | Qisqa videolar va mahsulot sharhlari — Eltron";
    const description = lang === "ru"
        ? "Смотрите интересные видео-обзоры современных гаджетов, электроники и товаров в магазине Eltron."
        : "Eltron do'konidagi zamonaviy gadjetlar va texnikalar haqidagi qiziqarli video sharhlarni tomosha qiling.";

    const canonicalUrl = lang === "ru" ? `${siteUrl}/ru/reels` : `${siteUrl}/reels`;

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
            languages: {
                "uz-UZ": `${siteUrl}/reels`,
                "ru-RU": `${siteUrl}/ru/reels`,
                "x-default": `${siteUrl}/reels`,
            },
        },
    };
}

export default function ReelsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
