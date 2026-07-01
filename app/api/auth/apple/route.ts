import { NextResponse } from 'next/server';

// Apple Sign In requires:
// APPLE_CLIENT_ID    — your Services ID (e.g. com.dbprosthetics.web)
// APPLE_TEAM_ID      — your Apple Developer Team ID
// APPLE_KEY_ID       — the Key ID of your Sign In with Apple private key
// APPLE_PRIVATE_KEY  — the contents of your .p8 private key file (base64 encoded)
// NEXT_PUBLIC_BASE_URL — your live URL (e.g. https://your-app.railway.app)

export async function GET() {
  const clientId = process.env.APPLE_CLIENT_ID;
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL;

  if (!clientId || !baseUrl) {
    return NextResponse.json(
      { error: 'Apple Sign In is not yet configured. Add APPLE_CLIENT_ID and related env vars in Railway.' },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${baseUrl}/api/auth/apple/callback`,
    response_type: 'code id_token',
    response_mode: 'form_post',
    scope:         'name email',
  });

  return NextResponse.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
}
