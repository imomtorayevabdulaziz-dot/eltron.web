import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CatalogClient from '../CatalogClient';
import { getCatalogCategories, resolveCategoryBySlug } from '@/lib/categories';
import { getCategorySlug } from '@/lib/slugify';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { lang: string; slug: string } }): Promise<Metadata> {
    const lang = params.lang === 'ru' ? 'ru' : 'uz';
    const baseUrl = 'https://eltron-web.vercel.app';
    const categories = await getCatalogCategories();
    const cat = resolveCategoryBySlug(categories, params.slug, lang);

    if (!cat) {
        return {
            title: "404 - Sahifa topilmadi | Eltron",
            robots: { index: false, follow: false },
        };
    }

    const name = lang === 'ru' ? (cat.name_ru || cat.name_uz || cat.name) : (cat.name_uz || cat.name);
    const uzSlug = getCategorySlug(cat, 'uz');
    const ruSlug = getCategorySlug(cat, 'ru');
    const canonicalSlug = lang === 'ru' ? ruSlug : uzSlug;

    const title = lang === 'ru'
        ? `${name} — купить в Ташкенте | Eltron`
        : `${name} — Toshkentda sotib olish | Eltron`;
    const description = lang === 'ru'
        ? `${name}: широкий выбор по выгодным ценам. Рассрочка, официальная гарантия и быстрая доставка. Eltron.`
        : `${name}: keng tanlov hamyonbop narxlarda. Muddatli to'lov, rasmiy kafolat va tez yetkazib berish. Eltron.`;

    const canonicalUrl = lang === 'ru'
        ? `${baseUrl}/ru/catalog/${ruSlug}`
        : `${baseUrl}/catalog/${uzSlug}`;

    return {
        title,
        description,
        openGraph: {
            title, description,
            url: canonicalUrl,
            siteName: 'Eltron', type: 'website',
            locale: lang === 'ru' ? 'ru_RU' : 'uz_UZ',
            images: [{ url: '/og-image.png', width: 1200, height: 630, alt: name }],
        },
        alternates: {
            canonical: canonicalUrl,
            languages: {
                'uz-UZ': `${baseUrl}/catalog/${uzSlug}`,
                'ru-RU': `${baseUrl}/ru/catalog/${ruSlug}`,
                'x-default': `${baseUrl}/catalog/${uzSlug}`,
            },
        },
        robots: { index: true, follow: true },
    };
}

export default async function CategoryCatalogPage({ params }: { params: { lang: string; slug: string } }) {
    const lang = params.lang === 'ru' ? 'ru' : 'uz';
    const categories = await getCatalogCategories();
    const cat = resolveCategoryBySlug(categories, params.slug, lang);

    if (!cat) notFound();

    return <CatalogClient initialCategories={categories} initialCategory={cat!.id} />;
}
