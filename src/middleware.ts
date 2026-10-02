import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js middleware for:
 * 1. Refreshing Supabase auth session (token rotation)
 * 2. Protecting /dashboard/* routes (redirect to login if unauthenticated)
 * 3. Redirecting authenticated users away from /auth/login
 * 4. Protecting /api/cron/* routes with CRON_SECRET
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname } = request.nextUrl;

  // Protect API cron routes with secret
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Helper to construct a redirect response while preserving any session cookies
  const createRedirectResponse = (targetUrl: URL): NextResponse => {
    const redirectResponse = NextResponse.redirect(targetUrl);
    // Copy all cookies from supabaseResponse so session tokens are preserved
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // IMPORTANT: Do NOT use getSession() for security-sensitive operations.
    // Use getUser() which validates the token with the Supabase Auth server.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        url.searchParams.set('redirect', pathname);
        return createRedirectResponse(url);
      }

      // Verify user has an active staff record
      const { data: staff } = await supabase
        .from('staff')
        .select('id, role, is_active')
        .eq('auth_user_id', user.id)
        .single();

      if (!staff || !staff.is_active) {
        // User exists in auth but not in staff table or is deactivated
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        url.searchParams.set('error', 'unauthorized');
        return createRedirectResponse(url);
      }
    }

    // Redirect authenticated users away from login page to dashboard
    if (pathname === '/auth/login' && user) {
      const redirectTarget = request.nextUrl.searchParams.get('redirect') || '/dashboard';
      const url = request.nextUrl.clone();
      url.pathname = redirectTarget;
      url.searchParams.delete('redirect');
      url.searchParams.delete('error');
      return createRedirectResponse(url);
    }
  } catch (err) {
    console.error('[Middleware] Supabase auth execution error:', err);
    // On unexpected auth error, redirect dashboard attempts to login
    if (pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return createRedirectResponse(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public static assets (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
