import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthorizeUrl, isOAuthSupported, isProviderConfigured } from '@/lib/oauth-providers';
import type { Provider } from '@/types';
import { randomBytes } from 'node:crypto';

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider } = await params;

	if (!isOAuthSupported(provider as Provider)) {
		return NextResponse.json(
			{ error: 'oauth_not_supported', message: `${provider} does not support OAuth. Please use an API key instead.` },
			{ status: 400 },
		);
	}

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const typedProvider = provider as Provider;

	if (!isProviderConfigured(typedProvider)) {
		return NextResponse.json(
			{
				error: 'not_configured',
				message: `OAuth for ${provider} is not configured yet. Please use API key instead, or contact the administrator.`,
			},
			{ status: 501 },
		);
	}

	const origin = new URL(request.url).origin;
	const state = `${user.id}:${randomBytes(16).toString('hex')}`;
	const authorizeUrl = buildAuthorizeUrl(typedProvider, origin, state);

	if (!authorizeUrl) {
		return NextResponse.json({ error: 'Failed to build authorize URL' }, { status: 500 });
	}

	return NextResponse.redirect(authorizeUrl);
}
