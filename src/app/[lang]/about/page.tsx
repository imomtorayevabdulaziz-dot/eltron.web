import { Metadata } from 'next';
import { translations } from "@/lib/translations";
import { getShopSettingsServer } from "@/lib/shop-settings.server";
import AboutClient from "./AboutClient";

export async function generateMetadata({ params: { lang } }: { params: { lang: string } }): Promise<Metadata> {
    const language = (lang === 'ru' ? 'ru' : 'uz') as 'uz' | 'ru';
    const t = translations[language];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://eltron-web.vercel.app';
    const settings = await getShopSettingsServer();
    const shopName = settings.name || 'Eltron';

    const title = `${t.aboutUs.title} | ${shopName} - O'zbekistonda №1 Premium Do'kon`;
    const description = `${t.aboutUs.subtitle}. ${t.aboutUs.mainTitle}. ${shopName} — O'zbekistonda sifatli elektronika va zamonaviy gadjetlar do'koni.`;

    const canonicalUrl = lang === 'ru' ? `${baseUrl}/ru/about` : `${baseUrl}/about`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: canonicalUrl,
            siteName: shopName,
            type: 'website',
            locale: lang === 'ru' ? 'ru_RU' : 'uz_UZ',
        },
        alternates: {
            canonical: canonicalUrl,
            languages: {
                'uz-UZ': `${baseUrl}/about`,
                'ru-RU': `${baseUrl}/ru/about`,
                'x-default': `${baseUrl}/about`,
            },
        },
    };
}

export default async function Page() {
    const settings = await getShopSettingsServer();
    return <AboutClient initialSettings={settings} />;
}
