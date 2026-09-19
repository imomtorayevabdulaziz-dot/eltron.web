import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/lib/i18n-config';

/**
 * Secure JWT Verification for Edge
 */
import { verifyJwt } from '@/lib/jwt-utils';

/**
 * Locale detection:
 * Boshlang'ich holatda va har doim HAR BIR tashrif buyuruvchi (sayt, telefon, Telegram WebApp)
 * uchun tizim O'ZBEKCHA ('uz') tilida ochiladi.
 * Faqatgina foydalanuvchi o'zi hohlab rus tilini tanlaganda (cookie 'eltron_locale'='ru' yoki 'NEXT_LOCALE'='ru')
 * rus tiliga o'tkaziladi.
 */
function getLocale(request: NextRequest): string {
    const cookieLocale = request.cookies.get('eltron_locale')?.value || request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale === 'ru') {
        return 'ru';
    }
    if (cookieLocale === 'uz') {
        return 'uz';
    }

    // Har doim standart sifatida O'zbek tili ('uz') ochiladi.
    // Brauzer yoki telefonning Accept-Language (ruscha) sarlavhalari hisobga olinmaydi.
    return i18n.defaultLocale; // 'uz'
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 0. Clean /[lang]/api/... into /api/...
    if (pathname.includes('/api/')) {
        const apiIdx = pathname.indexOf('/api/');
        if (apiIdx > 0) {
            const url = new URL(pathname.slice(apiIdx), request.url);
            url.search = request.nextUrl.search;
            return NextResponse.redirect(url);
        }
    }

    // 1. Bypass static & public files
    if (pathname.match(/\.(.*)$/) && !pathname.includes('/api/')) {
        return NextResponse.next();
    }

    // 2. Clean URL Bar: Strip /uz prefix from URL bar if present
    if (pathname === '/uz') {
        const url = new URL('/', request.url);
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url, 308);
    }
    if (pathname.startsWith('/uz/')) {
        const url = new URL(pathname.replace(/^\/uz/, ''), request.url);
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url, 308);
    }

    // 3. Admin Protection & Private Routes
    let localePart: string = i18n.defaultLocale;
    for (const locale of i18n.locales) {
        if (pathname.startsWith(`/${locale}/`)) {
            localePart = locale;
            break;
        }
    }

    const pathWithoutLocale = pathname.replace(new RegExp(`^/(${i18n.locales.join('|')})`), '') || pathname;
    const privateRoutes = [
        '/login',
        '/account',
        '/cart',
        '/wishlist',
        '/messages',
        '/checkout',
        '/orders',
        '/wallet',
        '/payment',
        '/order-success',
        '/auth',
        '/ref',
        '/admin',
    ];
    const isPrivateRoute = privateRoutes.some(
        (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
    );

    const applyRobotsPolicy = (response: NextResponse) => {
        if (isPrivateRoute) {
            response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        }
        return response;
    };

    if (pathWithoutLocale.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const adminToken = request.cookies.get('admin_token')?.value;
        const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim() || "default-secret";

        const payload = adminToken ? await verifyJwt(adminToken, ADMIN_SECRET) : null;
        const isAdmin = payload && payload.role === 'admin';

        if (!isAdmin) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
            
            const loginUrl = new URL(`/login`, request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return applyRobotsPolicy(NextResponse.redirect(loginUrl));
        }

        return applyRobotsPolicy(NextResponse.next());
    }

    // 4. Locale Resolution (Rewrite default Uzbek locale to keep address bar 100% clean)
    const pathnameIsMissingLocale = i18n.locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );

    if (pathnameIsMissingLocale && !pathname.startsWith('/api/')) {
        const locale = getLocale(request);
        if (locale === 'uz') {
            // Keep browser address bar 100% clean (no /uz) while serving Uzbek page internally
            const url = new URL(`/uz${pathname === '/' ? '' : pathname}`, request.url);
            url.search = request.nextUrl.search;
            return applyRobotsPolicy(NextResponse.rewrite(url));
        }
        const url = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
        url.search = request.nextUrl.search;
        return applyRobotsPolicy(NextResponse.redirect(url));
    }

    return applyRobotsPolicy(NextResponse.next());
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|icons|images|brands|videos|manifest.json|robots.txt|sitemap.xml|image-sitemap.xml|yandex_).*)',
    ],
};
