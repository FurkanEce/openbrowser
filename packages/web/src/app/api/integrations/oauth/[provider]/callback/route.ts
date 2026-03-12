import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens, isOAuthSupported } from '@/lib/oauth-providers';
import { encrypt } from '@/lib/crypto';
import type { Provider } from '@/types';

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider } = await params;
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get('code');
	const state = searchParams.get('state');
	const error = searchParams.get('error');

	const dashboardUrl = `${origin}/en/dashboard/integrations`;

	if (error) {
		return NextResponse.redirect(`${dashboardUrl}?error=${encodeURIComponent(error)}`);
	}

	if (!code || !state) {
		return NextResponse.redirect(`${dashboardUrl}?error=missing_code`);
	}

	if (!isOAuthSupported(provider as Provider)) {
		return NextResponse.redirect(`${dashboardUrl}?error=oauth_not_supported`);
	}

	// State'ten kullanıcı ID'sini çıkar
	const userId = state.split(':')[0];
	if (!userId) {
		return NextResponse.redirect(`${dashboardUrl}?error=invalid_state`);
	}

	// Mevcut kullanıcının state ile eşleştiğini doğrula
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user || user.id !== userId) {
		return NextResponse.redirect(`${dashboardUrl}?error=unauthorized`);
	}

	const typedProvider = provider as Provider;

	// Kodu token'larla değiştir
	const tokens = await exchangeCodeForTokens(typedProvider, code, origin);
	if (!tokens) {
		return NextResponse.redirect(`${dashboardUrl}?error=token_exchange_failed`);
	}

	// Token'ları şifrele ve kaydet
	const { encrypted: encryptedAccess, iv: accessIv } = encrypt(tokens.access_token);
	const encryptedRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

	const { error: dbError } = await supabase
		.from('oauth_connections')
		.upsert(
			{
				user_id: user.id,
				provider: typedProvider,
				access_token: `${encryptedAccess}:${accessIv}`,
				refresh_token: encryptedRefresh ? `${encryptedRefresh.encrypted}:${encryptedRefresh.iv}` : null,
				expires_at: tokens.expires_in
					? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
					: null,
				scope: tokens.scope ?? null,
			},
			{ onConflict: 'user_id,provider' },
		);

	if (dbError) {
		return NextResponse.redirect(`${dashboardUrl}?error=save_failed`);
	}

	return NextResponse.redirect(`${dashboardUrl}?success=${provider}`);
}
