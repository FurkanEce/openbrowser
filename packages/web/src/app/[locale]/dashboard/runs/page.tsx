import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { AgentRun, RunStatus } from '@/types';
import {
	Plus,
	Bot,
	Clock,
	DollarSign,
	ListOrdered,
} from 'lucide-react';

const statusColors: Record<RunStatus, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	running: 'bg-blue-100 text-blue-800',
	completed: 'bg-green-100 text-green-800',
	failed: 'bg-red-100 text-red-800',
	cancelled: 'bg-gray-100 text-gray-800',
};

export default async function RunsPage() {
	const t = await getTranslations('runs');
	const supabase = await createClient();

	const { data: { user } } = await supabase.auth.getUser();

	let runs: AgentRun[] = [];
	if (user) {
		const { data } = await supabase
			.from('agent_runs')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(50);
		runs = (data as AgentRun[]) ?? [];
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
				<Link
					href="/dashboard/runs/new"
					className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
				>
					<Plus className="h-4 w-4" />
					{t('newRun')}
				</Link>
			</div>

			{runs.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
					<Bot className="h-12 w-12 text-gray-400" />
					<p className="mt-4 text-sm text-gray-500">{t('noRuns')}</p>
					<Link
						href="/dashboard/runs/new"
						className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						<Plus className="h-4 w-4" />
						{t('newRun')}
					</Link>
				</div>
			) : (
				<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									{t('task')}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									{t('model')}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									{t('status')}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									<ListOrdered className="inline h-3.5 w-3.5 mr-1" />
									{t('steps')}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									<DollarSign className="inline h-3.5 w-3.5 mr-1" />
									{t('cost')}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
									<Clock className="inline h-3.5 w-3.5 mr-1" />
									{t('createdAt')}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{runs.map((run) => (
								<tr key={run.id} className="transition-colors hover:bg-gray-50">
									<td className="px-4 py-3">
										<Link
											href={`/dashboard/runs/${run.id}`}
											className="block max-w-xs truncate font-medium text-gray-900 hover:text-blue-600"
										>
											{run.task}
										</Link>
									</td>
									<td className="px-4 py-3 text-sm text-gray-600">
										{run.model}
									</td>
									<td className="px-4 py-3">
										<span
											className={cn(
												'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
												statusColors[run.status],
											)}
										>
											{t(`statuses.${run.status}`)}
										</span>
									</td>
									<td className="px-4 py-3 text-sm text-gray-600">
										{run.total_steps}
									</td>
									<td className="px-4 py-3 text-sm text-gray-600">
										{run.total_cost_usd != null
											? `$${run.total_cost_usd.toFixed(4)}`
											: '-'}
									</td>
									<td className="px-4 py-3 text-sm text-gray-500">
										{new Date(run.created_at).toLocaleDateString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
