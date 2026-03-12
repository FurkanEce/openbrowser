import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveApiKey, getApiKeys } from '@/lib/api-keys';
import type { Provider } from '@/types';

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch API keys (without decrypted values)
		const apiKeys = await getApiKeys(user.id);

		// Fetch OAuth connections
		const { data: oauthConnections, error } = await supabase
			.from('oauth_connections')
			.select('id, provider, scope, created_at, updated_at')
			.eq('user_id', user.id);

		if (error) {
			return NextResponse.json(
				{ error: 'Failed to fetch integrations' },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			apiKeys: apiKeys.map((k) => ({
				id: k.id,
				provider: k.provider,
				label: k.label,
				last_used: k.last_used,
				created_at: k.created_at,
				updated_at: k.updated_at,
			})),
			oauthConnections: oauthConnections ?? [],
		});
	} catch (err) {
		console.error('[GET /api/integrations]', err);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { type, provider, apiKey, label } = body as {
			type: 'api_key' | 'oauth';
			provider: Provider;
			apiKey?: string;
			label?: string;
		};

		if (!provider) {
			return NextResponse.json(
				{ error: 'Provider is required' },
				{ status: 400 },
			);
		}

		if (type === 'api_key') {
			if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
				return NextResponse.json(
					{ error: 'API key is required' },
					{ status: 400 },
				);
			}

			const record = await saveApiKey(user.id, provider, apiKey.trim(), label);

			return NextResponse.json({
				id: record.id,
				provider: record.provider,
				label: record.label,
				created_at: record.created_at,
				updated_at: record.updated_at,
			});
		}

		if (type === 'oauth') {
			// For OAuth, in a real app we'd initiate the OAuth flow.
			// For now, return a placeholder redirect URL.
			const redirectUrl = `/api/integrations/oauth/${provider}/authorize`;

			return NextResponse.json({ redirectUrl });
		}

		return NextResponse.json(
			{ error: 'Invalid type. Must be "api_key" or "oauth"' },
			{ status: 400 },
		);
	} catch (err) {
		console.error('[POST /api/integrations]', err);
		return NextResponse.json(
			{ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
			{ status: 500 },
		);
	}
}
