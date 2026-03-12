'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Provider } from '@/types';
import { ArrowLeft, Play, Loader2, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const providerModels: Record<Provider, { id: string; label: string }[]> = {
	openai: [
		{ id: 'gpt-4o', label: 'GPT-4o' },
		{ id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
		{ id: 'gpt-4.1', label: 'GPT-4.1' },
		{ id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
	],
	anthropic: [
		{ id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
		{ id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
	],
	google: [
		{ id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
		{ id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
		{ id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
	],
};

const providerLabels: Record<Provider, string> = {
	openai: 'OpenAI',
	anthropic: 'Anthropic',
	google: 'Google AI',
};

interface ConnectedProvider {
	provider: Provider;
	method: 'api_key' | 'oauth';
}

export default function NewRunPage() {
	const t = useTranslations('runs.new');
	const tCommon = useTranslations('common');
	const router = useRouter();

	const [task, setTask] = useState('');
	const [provider, setProvider] = useState<Provider | ''>('');
	const [model, setModel] = useState('');
	const [maxSteps, setMaxSteps] = useState(50);
	const [headless, setHeadless] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [connectedProviders, setConnectedProviders] = useState<ConnectedProvider[]>([]);
	const [loadingProviders, setLoadingProviders] = useState(true);

	useEffect(() => {
		async function fetchIntegrations() {
			try {
				const res = await fetch('/api/integrations');
				if (!res.ok) return;
				const data = await res.json();

				const connected: ConnectedProvider[] = [];
				for (const key of data.apiKeys ?? []) {
					if (!connected.some((c) => c.provider === key.provider)) {
						connected.push({ provider: key.provider, method: 'api_key' });
					}
				}
				for (const oauth of data.oauthConnections ?? []) {
					if (!connected.some((c) => c.provider === oauth.provider)) {
						connected.push({ provider: oauth.provider, method: 'oauth' });
					}
				}
				setConnectedProviders(connected);

				if (connected.length > 0) {
					const first = connected[0].provider;
					setProvider(first);
					setModel(providerModels[first][0].id);
				}
			} catch {
				// ignore
			} finally {
				setLoadingProviders(false);
			}
		}
		fetchIntegrations();
	}, []);

	const handleProviderChange = useCallback((newProvider: Provider) => {
		setProvider(newProvider);
		setModel(providerModels[newProvider][0].id);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!task.trim() || !provider) return;

		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch('/api/runs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ task, provider, model, maxSteps, headless }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create run');
			}

			const { run } = await response.json();
			router.push(`/dashboard/runs/${run.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			setSubmitting(false);
		}
	};

	const hasConnectedProviders = connectedProviders.length > 0;

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div className="flex items-center gap-4">
				<Link
					href="/dashboard/runs"
					className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
				>
					<ArrowLeft className="h-4 w-4" />
					{tCommon('back')}
				</Link>
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
					{t('title')}
				</h1>
			</div>

			{loadingProviders ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
				</div>
			) : !hasConnectedProviders ? (
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
					<div className="flex items-start gap-3">
						<AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
						<div>
							<p className="font-medium text-amber-800 dark:text-amber-300">
								{t('noProviders')}
							</p>
							<p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
								{t('noProvidersDescription')}
							</p>
							<Link
								href="/dashboard/integrations"
								className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-800 underline hover:no-underline dark:text-amber-300"
							>
								{t('goToIntegrations')}
							</Link>
						</div>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
					{error && (
						<div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
							{error}
						</div>
					)}

					{/* Gorev Tanimi */}
					<div className="space-y-2">
						<label htmlFor="task" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
							{t('taskLabel')}
						</label>
						<textarea
							id="task"
							value={task}
							onChange={(e) => setTask(e.target.value)}
							placeholder={t('taskPlaceholder')}
							rows={4}
							required
							className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
						/>
					</div>

					{/* Saglayici Secimi */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
							{t('providerLabel')}
						</label>
						<div className="grid grid-cols-3 gap-3">
							{connectedProviders.map((cp) => (
								<button
									key={cp.provider}
									type="button"
									onClick={() => handleProviderChange(cp.provider)}
									className={`relative rounded-lg border px-4 py-3 text-left transition-all ${
										provider === cp.provider
											? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 dark:border-white dark:bg-zinc-900 dark:ring-white'
											: 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600'
									}`}
								>
									<span className="block text-sm font-medium text-zinc-900 dark:text-white">
										{providerLabels[cp.provider]}
									</span>
									<span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
										{cp.method === 'oauth' ? 'OAuth' : 'API Key'}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Model Secimi */}
					{provider && (
						<div className="space-y-2">
							<label htmlFor="model" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
								{t('modelLabel')}
							</label>
							<div className="grid grid-cols-2 gap-2">
								{providerModels[provider].map((m) => (
									<button
										key={m.id}
										type="button"
										onClick={() => setModel(m.id)}
										className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
											model === m.id
												? 'border-zinc-900 bg-zinc-50 font-medium ring-1 ring-zinc-900 dark:border-white dark:bg-zinc-900 dark:ring-white'
												: 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600'
										}`}
									>
										<span className="text-zinc-900 dark:text-white">{m.label}</span>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Gelismis Yapilandirma */}
					<div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
						<h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('configLabel')}</h3>

						<div className="space-y-2">
							<label htmlFor="maxSteps" className="block text-sm text-zinc-600 dark:text-zinc-400">
								{t('maxSteps')}
							</label>
							<input
								id="maxSteps"
								type="number"
								min={1}
								max={200}
								value={maxSteps}
								onChange={(e) => setMaxSteps(parseInt(e.target.value, 10) || 50)}
								className="block w-32 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
							/>
						</div>

						<div className="flex items-center gap-3">
							<input
								id="headless"
								type="checkbox"
								checked={headless}
								onChange={(e) => setHeadless(e.target.checked)}
								className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
							/>
							<label htmlFor="headless" className="text-sm text-zinc-600 dark:text-zinc-400">
								{t('headless')}
							</label>
						</div>
					</div>

					{/* Gonder */}
					<button
						type="submit"
						disabled={submitting || !task.trim() || !provider}
						className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
					>
						{submitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Play className="h-4 w-4" />
						)}
						{t('startRun')}
					</button>
				</form>
			)}
		</div>
	);
}
