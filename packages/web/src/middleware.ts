import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
	const { pathname, searchParams } = request.nextUrl;

	// Skip middleware for auth routes
	if (pathname.startsWith('/auth/')) {
		return NextResponse.next();
	}

	// Handle OAuth/email auth code redirects on any path
	const code = searchParams.get('code');
	if (code) {
		const callbackUrl = new URL('/auth/callback', request.url);
		callbackUrl.searchParams.set('code', code);
		callbackUrl.searchParams.set('next', pathname || '/en/dashboard');
		return NextResponse.redirect(callbackUrl);
	}

	// Check if path is a dashboard route (needs auth)
	const isDashboardRoute = routing.locales.some((locale) => pathname.startsWith(`/${locale}/dashboard`));

	if (isDashboardRoute) {
		const { user, supabaseResponse } = await updateSession(request);

		if (!user) {
			const locale = pathname.split('/')[1] || routing.defaultLocale;
			const loginUrl = new URL(`/${locale}/login`, request.url);
			loginUrl.searchParams.set('redirectTo', pathname);
			return NextResponse.redirect(loginUrl);
		}

		// Run intl middleware on the supabase response
		const intlResponse = intlMiddleware(request);
		// Copy supabase cookies to intl response
		supabaseResponse.cookies.getAll().forEach((cookie) => {
			intlResponse.cookies.set(cookie.name, cookie.value);
		});
		return intlResponse;
	}

	// For non-dashboard routes, just handle i18n
	return intlMiddleware(request);
}

export const config = {
	matcher: ['/', '/(en|tr)/:path*', '/auth/:path*'],
};
