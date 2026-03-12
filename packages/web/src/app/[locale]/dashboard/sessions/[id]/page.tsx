import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import type { BrowserSession, SessionStatus } from '@/types';
import { ArrowLeft, Monitor, Clock, ExternalLink } from 'lucide-react';
import { TerminateSessionButton } from '../terminate-button';

const statusColors: Record<SessionStatus, string> = {
	active: 'bg-green-100 text-green-800',
	idle: 'bg-yellow-100 text-yellow-800',
	terminated: 'bg-gray-100 text-gray-800',
};

export default async function SessionDetailPage({
	params,
}: {
	params: Promise<{ id: string; locale: string }>;
}) {
	const { id } = await params;
	const t = await getTranslations('sessions');
	const tCommon = await getTranslations('common');
	const supabase = await createClient();

	const { data: { user } } = await supabase.auth.getUser();
	if (!user) notFound();

	const { data } = await supabase
		.from('browser_sessions')
		.select('*')
		.eq('id', id)
		.eq('user_id', user.id)
		.single();

	if (!data) notFound();

	const session = data as BrowserSession;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link
					href="/dashboard/sessions"
					className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
				>
					<ArrowLeft className="h-4 w-4" />
					{tCommon('back')}
				</Link>
				<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
			</div>

			<div className="rounded-lg border border-gray-200 bg-white p-6">
				<div className="flex items-center gap-3">
					<Monitor className="h-6 w-6 text-gray-400" />
					<span
						className={cn(
							'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
							statusColors[session.status],
						)}
					>
						{t(`statuses.${session.status}`)}
					</span>
				</div>

				<dl className="mt-6 grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-sm font-medium text-gray-500">
							<Clock className="mr-1.5 inline h-3.5 w-3.5" />
							Started
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{new Date(session.started_at).toLocaleString()}
						</dd>
					</div>

					{session.ended_at && (
						<div>
							<dt className="text-sm font-medium text-gray-500">
								<Clock className="mr-1.5 inline h-3.5 w-3.5" />
								Ended
							</dt>
							<dd className="mt-1 text-sm text-gray-900">
								{new Date(session.ended_at).toLocaleString()}
							</dd>
						</div>
					)}

					{session.browser_info && (
						<div className="sm:col-span-2">
							<dt className="text-sm font-medium text-gray-500">Browser Info</dt>
							<dd className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-700 font-mono">
								{JSON.stringify(session.browser_info, null, 2)}
							</dd>
						</div>
					)}
				</dl>

				<div className="mt-6 flex gap-3">
					{session.run_id && (
						<Link
							href={`/dashboard/runs/${session.run_id}`}
							className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
						>
							<ExternalLink className="h-3 w-3" />
							View Run
						</Link>
					)}
					{(session.status === 'active' || session.status === 'idle') && (
						<TerminateSessionButton
							sessionId={session.id}
							label={t('terminate')}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
