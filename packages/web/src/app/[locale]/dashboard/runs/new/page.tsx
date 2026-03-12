'use client';

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Provider } from '@/types';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const providerModels: Record<Provider, string[]> = {
	openai: ['gpt-4o', 'gpt-4o-mini'],
	anthropic: ['claude-sonnet-4-5', 'claude-haiku-4-5'],
	google: ['gemini-2.0-flash'],
};

const providerLabels: Record<Provider, string> = {
	openai: 'OpenAI',
	anthropic: 'Anthropic',
	google: 'Google',
};

export default function NewRunPage() {
	const t = useTranslations('runs.new');
	const tCommon = useTranslations('common');
	const router = useRouter();

	const [task, setTask] = useState('');
	const [provider, setProvider] = useState<Provider>('openai');
	const [model, setModel] = useState('gpt-4o');
	const [maxSteps, setMaxSteps] = useState(50);
	const [headless, setHeadless] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleProviderChange = useCallback((newProvider: Provider) => {
		setProvider(newProvider);
		setModel(providerModels[newProvider][0]);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!task.trim()) return;

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

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div className="flex items-center gap-4">
				<Link
					href="/dashboard/runs"
					className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
				>
					<ArrowLeft className="h-4 w-4" />
					{tCommon('back')}
				</Link>
				<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
				{error && (
					<div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
						{error}
					</div>
				)}

				{/* Task Description */}
				<div className="space-y-2">
					<label htmlFor="task" className="block text-sm font-medium text-gray-700">
						{t('taskLabel')}
					</label>
					<textarea
						id="task"
						value={task}
						onChange={(e) => setTask(e.target.value)}
						placeholder={t('taskPlaceholder')}
						rows={4}
						required
						className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				{/* Provider */}
				<div className="space-y-2">
					<label htmlFor="provider" className="block text-sm font-medium text-gray-700">
						{t('providerLabel')}
					</label>
					<select
						id="provider"
						value={provider}
						onChange={(e) => handleProviderChange(e.target.value as Provider)}
						className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						{(Object.keys(providerModels) as Provider[]).map((p) => (
							<option key={p} value={p}>
								{providerLabels[p]}
							</option>
						))}
					</select>
				</div>

				{/* Model */}
				<div className="space-y-2">
					<label htmlFor="model" className="block text-sm font-medium text-gray-700">
						{t('modelLabel')}
					</label>
					<select
						id="model"
						value={model}
						onChange={(e) => setModel(e.target.value)}
						className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						{providerModels[provider].map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				</div>

				{/* Advanced Configuration */}
				<div className="space-y-4 border-t border-gray-200 pt-4">
					<h3 className="text-sm font-medium text-gray-700">{t('configLabel')}</h3>

					{/* Max Steps */}
					<div className="space-y-2">
						<label htmlFor="maxSteps" className="block text-sm text-gray-600">
							{t('maxSteps')}
						</label>
						<input
							id="maxSteps"
							type="number"
							min={1}
							max={200}
							value={maxSteps}
							onChange={(e) => setMaxSteps(parseInt(e.target.value, 10) || 50)}
							className="block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					{/* Headless */}
					<div className="flex items-center gap-3">
						<input
							id="headless"
							type="checkbox"
							checked={headless}
							onChange={(e) => setHeadless(e.target.checked)}
							className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<label htmlFor="headless" className="text-sm text-gray-600">
							{t('headless')}
						</label>
					</div>
				</div>

				{/* Submit */}
				<button
					type="submit"
					disabled={submitting || !task.trim()}
					className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Play className="h-4 w-4" />
					)}
					{t('startRun')}
				</button>
			</form>
		</div>
	);
}
