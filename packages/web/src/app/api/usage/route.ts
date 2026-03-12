import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { data: records, error } = await supabase
		.from('usage_records')
		.select('*')
		.eq('user_id', user.id)
		.order('date', { ascending: false });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const usageRecords = records ?? [];

	// Aggregate totals
	const totals = usageRecords.reduce(
		(acc, record) => ({
			totalTokens: acc.totalTokens + record.input_tokens + record.output_tokens,
			totalCost: acc.totalCost + record.cost_usd,
			totalRuns: acc.totalRuns + record.run_count,
		}),
		{ totalTokens: 0, totalCost: 0, totalRuns: 0 },
	);

	// Group by model
	const byModel = usageRecords.reduce<
		Record<string, {
			model: string;
			inputTokens: number;
			outputTokens: number;
			cost: number;
			runCount: number;
		}>
	>((acc, record) => {
		if (!acc[record.model]) {
			acc[record.model] = {
				model: record.model,
				inputTokens: 0,
				outputTokens: 0,
				cost: 0,
				runCount: 0,
			};
		}
		acc[record.model].inputTokens += record.input_tokens;
		acc[record.model].outputTokens += record.output_tokens;
		acc[record.model].cost += record.cost_usd;
		acc[record.model].runCount += record.run_count;
		return acc;
	}, {});

	return NextResponse.json({
		totals,
		byModel: Object.values(byModel),
	});
}
