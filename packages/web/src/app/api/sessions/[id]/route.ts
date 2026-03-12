import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { data: session, error } = await supabase
		.from('browser_sessions')
		.select('*')
		.eq('id', id)
		.eq('user_id', user.id)
		.single();

	if (error || !session) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 });
	}

	return NextResponse.json({ session });
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { data: session, error } = await supabase
		.from('browser_sessions')
		.update({
			status: 'terminated',
			ended_at: new Date().toISOString(),
		})
		.eq('id', id)
		.eq('user_id', user.id)
		.in('status', ['active', 'idle'])
		.select()
		.single();

	if (error || !session) {
		return NextResponse.json(
			{ error: 'Session not found or already terminated' },
			{ status: 404 },
		);
	}

	return NextResponse.json({ session });
}
