import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // === MODO PREVIEW LOCAL ===
  // Como aún no has enlazado las bases de datos reales, he deshabilitado temporalmente 
  // la redirección estricta para que puedas navegar libremente por todas las pantallas.
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
