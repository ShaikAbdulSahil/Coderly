import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const token = request.cookies.get('coderly_token')?.value;
    const { pathname } = request.nextUrl;

    // 1. If hitting auth pages with a token, redirect to problems
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/problems', request.url));
    }

    // 2. Protect specific routes
    const protectedRoutes = ['/profile'];
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route)) || pathname.startsWith('/problems/');

    if (!token && isProtected) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/login',
        '/register',
        '/profile',
        '/problems/:path*',
    ],
};
