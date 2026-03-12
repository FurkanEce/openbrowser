import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import type { AgentRun, AgentStep, RunStatus } from '@/types';
import {
	ArrowLeft,
	Clock,
	DollarSign,
	AlertTriangle,
	ExternalLink,
	Coins,
	Image as ImageIcon,
} from 'lucide-react';

const statusColors: Record<RunStatus, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	running: 'bg-blue-100 text-blue-800',
	completed: 'bg-green-100 text-green-800',
	failed: 'bg-red-100 text-red-800',
	cancelled: 'bg-gray-100 text-gray-800',
};

function formatDuration(startedAt: string | null, completedAt: string | null): string {
	if (!startedAt) return '-';
	const start = new Date(startedAt).getTime();
	const end = completedAt ? new Date(completedAt).getTime() : Date.now();
	const seconds = Math.round((end - start) / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remaining = seconds % 60;
	return `${minutes}m ${remaining}s`;
}

export default async function RunDetailPage({
	params,
}: {
	params: Promise<{ id: string; locale: string }>;
}) {
	const { id } = await params;
	const t = await getTranslations('runs');
	const tDetail = await getTranslations('runs.detail');
	const tCommon = await getTranslations('common');
	const supabase = await createClient();

	const { data: { user } } = await supabase.auth.getUser();
	if (!user) notFound();

	const { data: run } = await supabase
		.from('agent_runs')
		.select('*')
		.eq('id', id)
		.eq('user_id', user.id)
		.single();

	if (!run) notFound();

	const typedRun = run as AgentRun;

	const { data: stepsData } = await supabase
		.from('agent_steps')
		.select('*')
		.eq('run_id', id)
		.order('step_number', { ascending: true });

	const steps = (stepsData as AgentStep[]) ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link
					href="/dashboard/runs"
					className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
				>
					<ArrowLeft className="h-4 w-4" />
					{tCommon('back')}
				</Link>
				<h1 className="text-2xl font-bold tracking-tight">{tDetail('title')}</h1>
			</div>

			{/* Run Info Card */}
			<div className="rounded-lg border border-gray-200 bg-white p-6">
				<div className="space-y-4">
					<p className="text-gray-900">{typedRun.task}</p>

					<div className="flex flex-wrap items-center gap-4">
						<span className="text-sm text-gray-500">
							{typedRun.model}
						</span>
						<span
							className={cn(
								'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
								statusColors[typedRun.status],
							)}
						>
							{t(`statuses.${typedRun.status}`)}
						</span>
						<span className="inline-flex items-center gap-1 text-sm text-gray-500">
							<DollarSign className="h-3.5 w-3.5" />
							{typedRun.total_cost_usd != null
								? `$${typedRun.total_cost_usd.toFixed(4)}`
								: '-'}
						</span>
						<span className="inline-flex items-center gap-1 text-sm text-gray-500">
							<Clock className="h-3.5 w-3.5" />
							{formatDuration(typedRun.started_at, typedRun.completed_at)}
						</span>
						<span className="text-sm text-gray-500">
							{typedRun.total_steps} {t('steps')}
						</span>
					</div>
				</div>
			</div>

			{/* Error display */}
			{typedRun.error_message && (
				<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
					<AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
					<div>
						<p className="text-sm font-medium text-red-800">{tCommon('error')}</p>
						<p className="mt-1 text-sm text-red-700">{typedRun.error_message}</p>
					</div>
				</div>
			)}

			{/* Step Timeline */}
			<div className="space-y-3">
				<h2 className="text-lg font-semibold text-gray-900">{tDetail('stepTimeline')}</h2>

				{steps.length === 0 ? (
					<p className="text-sm text-gray-500">{tCommon('noResults')}</p>
				) : (
					<div className="relative space-y-0">
						{/* Vertical line */}
						<div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

						{steps.map((step) => (
							<div key={step.id} className="relative flex gap-4 pb-6">
								{/* Step indicator */}
								<div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-sm font-medium text-gray-700">
									{step.step_number}
								</div>

								{/* Step content */}
								<div className="flex-1 rounded-lg border border-gray-200 bg-white p-4">
									<div className="flex flex-wrap items-center gap-3 text-sm">
										{step.url && (
											<span className="inline-flex items-center gap-1 text-blue-600">
												<ExternalLink className="h-3.5 w-3.5" />
												<span className="max-w-sm truncate">{step.url}</span>
											</span>
										)}
										<span className="inline-flex items-center gap-1 text-gray-500">
											<Coins className="h-3.5 w-3.5" />
											{step.input_tokens + step.output_tokens} {tDetail('tokens')}
										</span>
										<span className="inline-flex items-center gap-1 text-gray-500">
											<Clock className="h-3.5 w-3.5" />
											{step.duration_ms}ms
										</span>
									</div>

									{/* Action taken from agent_output */}
									{step.agent_output && Object.keys(step.agent_output).length > 0 && (
										<p className="mt-2 text-sm text-gray-600">
											{JSON.stringify(step.agent_output).slice(0, 200)}
										</p>
									)}

									{/* Error */}
									{step.error && (
										<p className="mt-2 text-sm text-red-600">{step.error}</p>
									)}

									{/* Screenshot thumbnail */}
									{step.screenshot_url && (
										<div className="mt-3">
											<a
												href={step.screenshot_url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
											>
												<ImageIcon className="h-3.5 w-3.5" />
												{tDetail('screenshot')}
											</a>
											<img
												src={step.screenshot_url}
												alt={`Step ${step.step_number} screenshot`}
												className="mt-1 h-32 w-auto rounded border border-gray-200 object-cover"
												loading="lazy"
											/>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
