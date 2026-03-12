import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Try to delete from api_keys first
		const { error: apiKeyError, count: apiKeyCount } = await supabase
			.from('api_keys')
			.delete({ count: 'exact' })
			.eq('id', id)
			.eq('user_id', user.id);

		if (apiKeyError) {
			return NextResponse.json(
				{ error: 'Failed to delete integration' },
				{ status: 500 },
			);
		}

		if (apiKeyCount && apiKeyCount > 0) {
			return NextResponse.json({ success: true, type: 'api_key' });
		}

		// If not found in api_keys, try oauth_connections
		const { error: oauthError, count: oauthCount } = await supabase
			.from('oauth_connections')
			.delete({ count: 'exact' })
			.eq('id', id)
			.eq('user_id', user.id);

		if (oauthError) {
			return NextResponse.json(
				{ error: 'Failed to delete integration' },
				{ status: 500 },
			);
		}

		if (oauthCount && oauthCount > 0) {
			return NextResponse.json({ success: true, type: 'oauth' });
		}

		return NextResponse.json(
			{ error: 'Integration not found' },
			{ status: 404 },
		);
	} catch {
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
}
