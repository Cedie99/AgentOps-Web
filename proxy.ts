import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  // Development mode: Skip auth if Supabase is not configured
  const isDevelopment = process.env.NODE_ENV === 'development'
  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

  if (isDevelopment && !supabaseConfigured) {
    // Allow all routes in development when Supabase is not set up
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protect routes that require authentication
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role-based access for dashboard routes
    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
      try {
        // Fetch user role from the API
        const apiUrl = new URL('/api/users/check-status', request.url)
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email })
        })

        if (response.ok) {
          const userData = await response.json()

          // Only ADMIN and SUPER_ADMIN can access web dashboard
          const webOnlyRoles = ['ADMIN', 'SUPER_ADMIN']
          if (!webOnlyRoles.includes(userData.role)) {
            // Sign out mobile-only users and redirect to login
            await supabase.auth.signOut()
            return NextResponse.redirect(new URL('/login', request.url))
          }

          // Check if user is active
          if (userData.status !== 'ACTIVE') {
            await supabase.auth.signOut()
            return NextResponse.redirect(new URL('/login', request.url))
          }
        }
      } catch (error) {
        console.error('Error checking user role in proxy:', error)
        // On error, allow through (will be caught by login page check)
      }
    }

    // Redirect authenticated users away from login/signup
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  } catch (error) {
    // If Supabase fails, allow access in development
    if (isDevelopment) {
      console.warn('Supabase middleware error (development mode):', error)
      return NextResponse.next()
    }
    throw error
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
