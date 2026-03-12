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

	// Verify the run belongs to this user
	const { data: run, error: runError } = await supabase
		.from('agent_runs')
		.select('id')
		.eq('id', id)
		.eq('user_id', user.id)
		.single();

	if (runError || !run) {
		return NextResponse.json({ error: 'Run not found' }, { status: 404 });
	}

	const { data: steps, error } = await supabase
		.from('agent_steps')
		.select('*')
		.eq('run_id', id)
		.order('step_number', { ascending: true });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ steps: steps ?? [] });
}
