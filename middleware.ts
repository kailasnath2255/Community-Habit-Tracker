import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth Session Middleware
 * CRITICAL: Refreshes Supabase session and ensures auth context is available
 * This must run on every request to keep sessions active
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Set cookies in request
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            
            // Create new response with updated cookies
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            
            // Set cookies in response so browser stores them
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Call getSession to refresh the token
    // This is important for keeping the auth context active
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('[middleware] Session refresh warning:', error.message);
    }

    if (session) {
      console.log('[middleware] Session refreshed for user:', session.user?.id);
    }
  } catch (error) {
    console.error('[middleware] Error:', error);
    // Continue even if middleware fails
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
