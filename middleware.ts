import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Dummy middleware to override any broken middleware on Vercel
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
