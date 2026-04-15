import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server' // 1. Import NextResponse

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth() // 2. Use userId or sessionId to check status

  // If the user isn't signed in and the route is protected
  if (!userId && isProtectedRoute(req)) {
    // 3. Construct the home URL and redirect
    const homeUrl = new URL('/', req.url)
    return NextResponse.redirect(homeUrl)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}