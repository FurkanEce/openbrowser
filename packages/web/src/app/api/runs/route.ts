import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Provider } from '@/types';

export async function GET(request: NextRequest) {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const searchParams = request.nextUrl.searchParams;
	const page = parseInt(searchParams.get('page') || '1', 10);
	const limit = parseInt(searchParams.get('limit') || '20', 10);
	const offset = (page - 1) * limit;

	const { data: runs, error, count } = await supabase
		.from('agent_runs')
		.select('*', { count: 'exact' })
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({
		runs,
		pagination: {
			page,
			limit,
			total: count ?? 0,
			totalPages: Math.ceil((count ?? 0) / limit),
		},
	});
}

export async function POST(request: NextRequest) {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { task, provider, model, maxSteps, headless } = body as {
		task: string;
		provider: Provider;
		model: string;
		maxSteps: number;
		headless: boolean;
	};

	if (!task || !provider || !model) {
		return NextResponse.json(
			{ error: 'Missing required fields: task, provider, model' },
			{ status: 400 },
		);
	}

	const { data: run, error } = await supabase
		.from('agent_runs')
		.insert({
			user_id: user.id,
			task,
			provider,
			model,
			status: 'pending',
			total_steps: 0,
			total_input_tokens: 0,
			total_output_tokens: 0,
			agent_config: {
				max_steps: maxSteps ?? 50,
				headless: headless ?? true,
			},
		})
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	// Worker'ı tetikle (arka planda, hata olursa yutulur)
	triggerWorker(run.id).catch((err) => {
		console.error(`[api/runs] failed to trigger worker for ${run.id}:`, err);
	});

	return NextResponse.json({ run }, { status: 201 });
}

async function triggerWorker(runId: string): Promise<void> {
	const workerUrl = process.env.WORKER_URL;
	console.log(`[api/runs] triggerWorker called, WORKER_URL=${workerUrl ? 'SET' : 'NOT SET'}, runId=${runId}`);

	if (!workerUrl) {
		console.error('[api/runs] WORKER_URL not set, run will stay pending');
		return;
	}

	const url = `${workerUrl}/run`;
	console.log(`[api/runs] calling worker: POST ${url}`);

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(process.env.WORKER_SECRET
				? { Authorization: `Bearer ${process.env.WORKER_SECRET}` }
				: {}),
		},
		body: JSON.stringify({ runId }),
	});

	const body = await res.text();
	console.log(`[api/runs] worker response: ${res.status} ${body}`);

	if (!res.ok) {
		throw new Error(`Worker responded with ${res.status}: ${body}`);
	}
}
