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

	const { data: run, error } = await supabase
		.from('agent_runs')
		.select('*')
		.eq('id', id)
		.eq('user_id', user.id)
		.single();

	if (error || !run) {
		return NextResponse.json({ error: 'Run not found' }, { status: 404 });
	}

	const { data: steps } = await supabase
		.from('agent_steps')
		.select('*')
		.eq('run_id', id)
		.order('step_number', { ascending: true });

	return NextResponse.json({ run, steps: steps ?? [] });
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

	const { data: run, error } = await supabase
		.from('agent_runs')
		.update({ status: 'cancelled', completed_at: new Date().toISOString() })
		.eq('id', id)
		.eq('user_id', user.id)
		.in('status', ['pending', 'running'])
		.select()
		.single();

	if (error || !run) {
		return NextResponse.json(
			{ error: 'Run not found or cannot be cancelled' },
			{ status: 404 },
		);
	}

	return NextResponse.json({ run });
}
