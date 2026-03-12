import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import {
	Activity,
	DollarSign,
	Hash,
	Play,
} from 'lucide-react';
import type { AgentRun, RunStatus } from '@/types';

function StatusBadge({ status }: { status: RunStatus }) {
	const colors: Record<RunStatus, string> = {
		pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
		running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
		completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
		failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		cancelled: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
	};

	return (
		<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	);
}

export default async function DashboardPage() {
	const t = await getTranslations('dashboard');
	const supabase = await createClient();

	// Fetch recent runs
	const { data: recentRuns } = await supabase
		.from('agent_runs')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(5);

	const runs = (recentRuns ?? []) as AgentRun[];

	// Compute stats from runs or use defaults
	const { data: allRuns } = await supabase
		.from('agent_runs')
		.select('status, total_cost_usd, total_input_tokens, total_output_tokens');

	const allRunsData = (allRuns ?? []) as Pick<AgentRun, 'status' | 'total_cost_usd' | 'total_input_tokens' | 'total_output_tokens'>[];

	const totalRuns = allRunsData.length;
	const totalCost = allRunsData.reduce((sum, r) => sum + (r.total_cost_usd ?? 0), 0);
	const totalTokens = allRunsData.reduce(
		(sum, r) => sum + r.total_input_tokens + r.total_output_tokens,
		0,
	);

	const { count: activeSessions } = await supabase
		.from('browser_sessions')
		.select('*', { count: 'exact', head: true })
		.eq('status', 'active');

	const stats = [
		{
			label: t('totalRuns'),
			value: totalRuns.toLocaleString(),
			icon: Play,
			color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
		},
		{
			label: t('activeSessionsCount'),
			value: (activeSessions ?? 0).toLocaleString(),
			icon: Activity,
			color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
		},
		{
			label: t('totalCost'),
			value: `$${totalCost.toFixed(2)}`,
			icon: DollarSign,
			color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
		},
		{
			label: t('tokensUsed'),
			value: totalTokens.toLocaleString(),
			icon: Hash,
			color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
		},
	];

	return (
		<div className="space-y-8">
			{/* Page heading */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
					{t('overview')}
				</h1>
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<div
							key={stat.label}
							className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
						>
							<div className="flex items-center gap-4">
								<div className={`rounded-lg p-2.5 ${stat.color}`}>
									<Icon className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm text-zinc-500 dark:text-zinc-400">
										{stat.label}
									</p>
									<p className="text-2xl font-bold text-zinc-900 dark:text-white">
										{stat.value}
									</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Recent runs */}
			<div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
				<div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
					<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
						{t('recentRuns')}
					</h2>
				</div>
				<div className="overflow-x-auto">
					{runs.length === 0 ? (
						<div className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
							No runs yet. Start your first agent run!
						</div>
					) : (
						<table className="w-full text-left text-sm" role="table">
							<thead>
								<tr className="border-b border-zinc-100 dark:border-zinc-800">
									<th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
										Task
									</th>
									<th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
										Model
									</th>
									<th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
										Status
									</th>
									<th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
										Steps
									</th>
									<th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">
										Cost
									</th>
								</tr>
							</thead>
							<tbody>
								{runs.map((run) => (
									<tr
										key={run.id}
										className="border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-900/50"
									>
										<td className="max-w-[240px] truncate px-6 py-4 font-medium text-zinc-900 dark:text-white">
											{run.task}
										</td>
										<td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
											{run.model}
										</td>
										<td className="px-6 py-4">
											<StatusBadge status={run.status} />
										</td>
										<td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
											{run.total_steps}
										</td>
										<td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
											${(run.total_cost_usd ?? 0).toFixed(4)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}
