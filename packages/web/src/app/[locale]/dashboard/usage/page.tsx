import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import type { UsageRecord } from '@/types';
import {
	Coins,
	DollarSign,
	Activity,
} from 'lucide-react';

export default async function UsagePage() {
	const t = await getTranslations('usage');
	const supabase = await createClient();

	const { data: { user } } = await supabase.auth.getUser();

	let records: UsageRecord[] = [];
	if (user) {
		const { data } = await supabase
			.from('usage_records')
			.select('*')
			.eq('user_id', user.id)
			.order('date', { ascending: false });
		records = (data as UsageRecord[]) ?? [];
	}

	// Compute totals
	const totals = records.reduce(
		(acc, r) => ({
			totalTokens: acc.totalTokens + r.input_tokens + r.output_tokens,
			totalCost: acc.totalCost + r.cost_usd,
			totalRuns: acc.totalRuns + r.run_count,
		}),
		{ totalTokens: 0, totalCost: 0, totalRuns: 0 },
	);

	// Group by model
	const byModel = records.reduce<
		Record<string, {
			model: string;
			inputTokens: number;
			outputTokens: number;
			cost: number;
			runCount: number;
		}>
	>((acc, r) => {
		if (!acc[r.model]) {
			acc[r.model] = {
				model: r.model,
				inputTokens: 0,
				outputTokens: 0,
				cost: 0,
				runCount: 0,
			};
		}
		acc[r.model].inputTokens += r.input_tokens;
		acc[r.model].outputTokens += r.output_tokens;
		acc[r.model].cost += r.cost_usd;
		acc[r.model].runCount += r.run_count;
		return acc;
	}, {});

	const modelUsage = Object.values(byModel);

	const statCards = [
		{
			label: t('totalTokens'),
			value: totals.totalTokens.toLocaleString(),
			icon: Coins,
			color: 'text-purple-600 bg-purple-100',
		},
		{
			label: t('totalCost'),
			value: `$${totals.totalCost.toFixed(2)}`,
			icon: DollarSign,
			color: 'text-green-600 bg-green-100',
		},
		{
			label: t('totalRuns'),
			value: totals.totalRuns.toLocaleString(),
			icon: Activity,
			color: 'text-blue-600 bg-blue-100',
		},
	];

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

			{/* Stat cards */}
			<div className="grid gap-4 sm:grid-cols-3">
				{statCards.map((card) => (
					<div
						key={card.label}
						className="rounded-lg border border-gray-200 bg-white p-5"
					>
						<div className="flex items-center gap-3">
							<div className={`rounded-lg p-2 ${card.color}`}>
								<card.icon className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm text-gray-500">{card.label}</p>
								<p className="text-2xl font-bold text-gray-900">{card.value}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Usage by model */}
			<div className="space-y-3">
				<h2 className="text-lg font-semibold text-gray-900">{t('byModel')}</h2>

				{modelUsage.length === 0 ? (
					<p className="text-sm text-gray-500">{t('totalRuns')}: 0</p>
				) : (
					<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
										Model
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
										{t('inputTokens')}
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
										{t('outputTokens')}
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
										{t('totalCost')}
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
										{t('totalRuns')}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{modelUsage.map((row) => (
									<tr key={row.model} className="transition-colors hover:bg-gray-50">
										<td className="px-4 py-3 text-sm font-medium text-gray-900">
											{row.model}
										</td>
										<td className="px-4 py-3 text-sm text-gray-600">
											{row.inputTokens.toLocaleString()}
										</td>
										<td className="px-4 py-3 text-sm text-gray-600">
											{row.outputTokens.toLocaleString()}
										</td>
										<td className="px-4 py-3 text-sm text-gray-600">
											${row.cost.toFixed(4)}
										</td>
										<td className="px-4 py-3 text-sm text-gray-600">
											{row.runCount}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
