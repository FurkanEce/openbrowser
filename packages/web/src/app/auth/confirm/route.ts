import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);
	const token_hash = searchParams.get('token_hash');
	const type = searchParams.get('type');
	const next = searchParams.get('next') ?? '/en/dashboard';

	if (token_hash && type) {
		const cookieStore = await cookies();
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
						try {
							for (const { name, value, options } of cookiesToSet) {
								cookieStore.set(name, value, options);
							}
						} catch {
							// ignore
						}
					},
				},
			},
		);

		const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
		if (!error) {
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	return NextResponse.redirect(`${origin}/en/login?error=auth_failed`);
}
