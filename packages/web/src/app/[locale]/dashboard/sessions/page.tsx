import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { BrowserSession, SessionStatus } from '@/types';
import { Monitor, Globe } from 'lucide-react';
import { TerminateSessionButton } from './terminate-button';

const statusColors: Record<SessionStatus, string> = {
	active: 'bg-green-100 text-green-800',
	idle: 'bg-yellow-100 text-yellow-800',
	terminated: 'bg-gray-100 text-gray-800',
};

export default async function SessionsPage() {
	const t = await getTranslations('sessions');
	const supabase = await createClient();

	const { data: { user } } = await supabase.auth.getUser();

	let sessions: BrowserSession[] = [];
	if (user) {
		const { data } = await supabase
			.from('browser_sessions')
			.select('*')
			.eq('user_id', user.id)
			.order('started_at', { ascending: false });
		sessions = (data as BrowserSession[]) ?? [];
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

			{sessions.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
					<Monitor className="h-12 w-12 text-gray-400" />
					<p className="mt-4 text-sm text-gray-500">{t('noSessions')}</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{sessions.map((session) => (
						<div
							key={session.id}
							className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
						>
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									<Globe className="h-5 w-5 text-gray-400" />
									<span
										className={cn(
											'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
											statusColors[session.status],
										)}
									>
										{t(`statuses.${session.status}`)}
									</span>
								</div>
							</div>

							<div className="mt-3 space-y-1.5 text-sm text-gray-500">
								<p>
									{new Date(session.started_at).toLocaleString()}
								</p>
								{session.ended_at && (
									<p>
										{new Date(session.ended_at).toLocaleString()}
									</p>
								)}
								{session.run_id && (
									<Link
										href={`/dashboard/runs/${session.run_id}`}
										className="block text-blue-600 hover:underline"
									>
										{t('view')} run
									</Link>
								)}
							</div>

							<div className="mt-4 flex gap-2">
								<Link
									href={`/dashboard/sessions/${session.id}`}
									className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
								>
									{t('view')}
								</Link>
								{(session.status === 'active' || session.status === 'idle') && (
									<TerminateSessionButton
										sessionId={session.id}
										label={t('terminate')}
									/>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
