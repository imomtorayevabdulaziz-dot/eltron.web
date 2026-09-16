import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CatalogClient from './CatalogClient';
import { getCatalogCategories } from '@/lib/categories';
import { getCategorySlug } from '@/lib/slugify';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    const lang = params.lang || 'uz';
    const baseUrl = 'https://eltron-web.vercel.app';

    return {
        title: lang === 'uz' 
            ? "Katalog | Eltron - Premium Elektronika va Gadjetlar O'zbekistonda"
            : "Каталог | Eltron - Премиум электроника и гаджеты в Узбекистане",
        description: lang === 'uz'
            ? "Eltron onlayn do'konida barcha turdagi aksessuarlar, smartfonlar va gadjetlar katalogi. Rasmiy kafolat va tez yetkazib berish."
            : "Каталог всех видов аксессуаров, смартфонов и гаджетов в онлайн магазине Eltron. Официальная гарантия и быстрая доставка.",
        keywords: ["katalog", "aksessuarlar", "smartfonlar", "gadjetlar", "elektronika", "Eltron katalogi", "Toshkent", "Uzbekistan"],
        openGraph: {
            title: lang === 'uz' 
                ? "Katalog | Eltron - Premium Elektronika va Gadjetlar"
                : "Каталог | Eltron - Премиум электроника и гаджеты",
            description: lang === 'uz'
                ? "Barcha turdagi original aksessuarlar va elektronika mahsulotlari katalogi."
                : "Каталог всех видов оригинальных аксессуаров и электроники.",
            url: `${baseUrl}/${lang}/catalog`,
            siteName: "Eltron",
            images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Eltron Katalog" }],
            locale: lang === 'uz' ? "uz_UZ" : "ru_RU",
            type: "website",
        },
        alternates: {
            canonical: `${baseUrl}/${lang}/catalog`,
            languages: {
                'uz-UZ': `${baseUrl}/uz/catalog`,
                'ru-RU': `${baseUrl}/ru/catalog`,
                'x-default': `${baseUrl}/uz/catalog`,
            },
        }
    };
}

export const revalidate = 0; // Dynamic SSR

export default async function CatalogPage({ params, searchParams }: {
    params: { lang: string };
    searchParams?: { category?: string };
}) {
    const categories = await getCatalogCategories();

    // Eski `?category=ID` havolalarni toza URL'ga 301-redirect (SEO + indekslangan URL'lar)
    const catId = searchParams?.category;
    if (catId) {
        const cat = categories.find((c) => c.id === catId);
        if (cat) {
            const lang = params.lang === 'ru' ? 'ru' : 'uz';
            redirect(`/${lang}/catalog/${getCategorySlug(cat, lang)}`);
        }
    }

    return <CatalogClient initialCategories={categories} />;
}

