'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
	CheckCircle2,
	Eye,
	EyeOff,
	Key,
	Loader2,
	PlugZap,
	Shield,
	Trash2,
	Unplug,
	Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Provider } from '@/types';

/* ------------------------------------------------------------------ */
/*  Tipler                                                             */
/* ------------------------------------------------------------------ */

interface ApiKeyInfo {
	id: string;
	provider: Provider;
	label: string | null;
	last_used: string | null;
	created_at: string;
	updated_at: string;
}

interface OAuthInfo {
	id: string;
	provider: Provider;
	scope: string | null;
	created_at: string;
	updated_at: string;
}

interface IntegrationData {
	apiKeys: ApiKeyInfo[];
	oauthConnections: OAuthInfo[];
}

/* ------------------------------------------------------------------ */
/*  Sağlayıcı tanımları                                                */
/* ------------------------------------------------------------------ */

const providers: {
	id: Provider;
	name: string;
	description: string;
	color: string;
	bgColor: string;
	icon: typeof Zap;
	supportsOAuth: boolean;
}[] = [
	{
		id: 'openai',
		name: 'OpenAI',
		description: 'GPT-4o, GPT-4, GPT-3.5',
		color: 'text-green-700 dark:text-green-400',
		bgColor: 'bg-green-100 dark:bg-green-900/30',
		icon: Zap,
		supportsOAuth: false,
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		description: 'Claude 4, Claude 3.5 Sonnet',
		color: 'text-orange-700 dark:text-orange-400',
		bgColor: 'bg-orange-100 dark:bg-orange-900/30',
		icon: Shield,
		supportsOAuth: false,
	},
	{
		id: 'google',
		name: 'Google AI',
		description: 'Gemini 2.5 Pro, Gemini Flash',
		color: 'text-blue-700 dark:text-blue-400',
		bgColor: 'bg-blue-100 dark:bg-blue-900/30',
		icon: PlugZap,
		supportsOAuth: true,
	},
];

/* ------------------------------------------------------------------ */
/*  Ana sayfa bileşeni                                                 */
/* ------------------------------------------------------------------ */

export default function IntegrationsPage() {
	const t = useTranslations('integrations');

	const [data, setData] = useState<IntegrationData>({ apiKeys: [], oauthConnections: [] });
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		try {
			const res = await fetch('/api/integrations');
			if (res.ok) {
				const json = await res.json();
				setData(json);
			}
		} catch {
			// sessizce başarısız ol
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Başlık */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
					{t('title')}
				</h1>
				<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
					{t('subtitle')}
				</p>
			</div>

			{/* Sağlayıcı kartları */}
			<div className="grid grid-cols-1 gap-6">
				{providers.map((provider) => (
					<ProviderCard
						key={provider.id}
						provider={provider}
						apiKey={data.apiKeys.find((k) => k.provider === provider.id) ?? null}
						oauth={data.oauthConnections.find((c) => c.provider === provider.id) ?? null}
						onRefresh={fetchData}
					/>
				))}
			</div>

			{/* Güvenlik bilgisi */}
			<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
				<p className="text-sm text-zinc-600 dark:text-zinc-400">
					{t('securityNote')}
				</p>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Sağlayıcı kartı                                                    */
/* ------------------------------------------------------------------ */

interface ProviderCardProps {
	provider: (typeof providers)[number];
	apiKey: ApiKeyInfo | null;
	oauth: OAuthInfo | null;
	onRefresh: () => void;
}

function ProviderCard({ provider, apiKey, oauth, onRefresh }: ProviderCardProps) {
	const t = useTranslations('integrations');
	const [activeTab, setActiveTab] = useState<'oauth' | 'apiKey'>(
		provider.supportsOAuth ? 'oauth' : 'apiKey',
	);

	const isConnected = !!apiKey || !!oauth;
	const Icon = provider.icon;

	return (
		<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
			{/* Kart başlığı */}
			<div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
				<div className="flex items-center gap-4">
					<div className={cn('rounded-lg p-2.5', provider.bgColor)}>
						<Icon className={cn('h-5 w-5', provider.color)} />
					</div>
					<div>
						<h3 className="font-semibold text-zinc-900 dark:text-white">
							{provider.name}
						</h3>
						<p className="text-sm text-zinc-500 dark:text-zinc-400">
							{provider.description}
						</p>
					</div>
				</div>

				{/* Bağlantı durumu */}
				{isConnected ? (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
						<CheckCircle2 className="h-3.5 w-3.5" />
						{t('status.connected')}
					</span>
				) : (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
						{t('status.notConnected')}
					</span>
				)}
			</div>

			{/* Sekmeler — sadece OAuth destekleyen sağlayıcılarda göster */}
			{provider.supportsOAuth && (
				<div className="border-b border-zinc-100 dark:border-zinc-800">
					<div className="flex">
						<button
							type="button"
							onClick={() => setActiveTab('oauth')}
							className={cn(
								'relative px-6 py-3 text-sm font-medium transition-colors',
								activeTab === 'oauth'
									? 'text-zinc-900 dark:text-white'
									: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300',
							)}
						>
							{t('tabs.oauth')}
							{activeTab === 'oauth' && (
								<span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-900 dark:bg-white" />
							)}
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('apiKey')}
							className={cn(
								'relative px-6 py-3 text-sm font-medium transition-colors',
								activeTab === 'apiKey'
									? 'text-zinc-900 dark:text-white'
									: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300',
							)}
						>
							{t('tabs.apiKey')}
							{activeTab === 'apiKey' && (
								<span className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-900 dark:bg-white" />
							)}
						</button>
					</div>
				</div>
			)}

			{/* Sekme içeriği */}
			<div className="p-6">
				{activeTab === 'oauth' && provider.supportsOAuth ? (
					<OAuthTab provider={provider.id} oauth={oauth} onRefresh={onRefresh} />
				) : (
					<ApiKeyTab provider={provider.id} apiKey={apiKey} onRefresh={onRefresh} />
				)}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  OAuth sekmesi (sadece Google için)                                 */
/* ------------------------------------------------------------------ */

interface OAuthTabProps {
	provider: Provider;
	oauth: OAuthInfo | null;
	onRefresh: () => void;
}

function OAuthTab({ provider, oauth, onRefresh }: OAuthTabProps) {
	const t = useTranslations('integrations.oauth');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	async function handleConnect() {
		setLoading(true);
		setError('');
		try {
			const res = await fetch(`/api/integrations/oauth/${provider}`);
			if (res.redirected) {
				window.location.href = res.url;
				return;
			}
			const json = await res.json();
			if (json.error === 'not_configured') {
				setError(json.message);
			} else if (json.error) {
				setError(json.message || json.error);
			}
		} catch {
			// sessizce başarısız ol
		} finally {
			setLoading(false);
		}
	}

	async function handleDisconnect() {
		if (!oauth) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/integrations/${oauth.id}`, {
				method: 'DELETE',
			});
			if (res.ok) {
				onRefresh();
			}
		} catch {
			// sessizce başarısız ol
		} finally {
			setLoading(false);
		}
	}

	if (oauth) {
		return (
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
					<div>
						<p className="text-sm font-medium text-zinc-900 dark:text-white">
							{t('connected')}
						</p>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							{t('connectedAt', {
								date: new Date(oauth.created_at).toLocaleDateString(),
							})}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={handleDisconnect}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
				>
					{loading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Unplug className="h-4 w-4" />
					)}
					{t('disconnect')}
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{error && (
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
					{error}
				</div>
			)}
			<div className="flex items-center justify-between">
				<p className="text-sm text-zinc-500 dark:text-zinc-400">
					{t('description')}
				</p>
				<button
					type="button"
					onClick={handleConnect}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
				>
					{loading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<PlugZap className="h-4 w-4" />
					)}
					{t('connect')}
				</button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  API Key sekmesi                                                    */
/* ------------------------------------------------------------------ */

interface ApiKeyTabProps {
	provider: Provider;
	apiKey: ApiKeyInfo | null;
	onRefresh: () => void;
}

function ApiKeyTab({ provider, apiKey, onRefresh }: ApiKeyTabProps) {
	const t = useTranslations('integrations.apiKey');
	const [keyValue, setKeyValue] = useState('');
	const [showKey, setShowKey] = useState(false);
	const [saving, setSaving] = useState(false);
	const [removing, setRemoving] = useState(false);
	const [confirmRemove, setConfirmRemove] = useState(false);

	async function handleSave() {
		if (!keyValue.trim()) return;
		setSaving(true);
		try {
			const res = await fetch('/api/integrations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'api_key', provider, apiKey: keyValue.trim() }),
			});
			if (res.ok) {
				setKeyValue('');
				onRefresh();
			}
		} catch {
			// sessizce başarısız ol
		} finally {
			setSaving(false);
		}
	}

	async function handleRemove() {
		if (!apiKey) return;
		setRemoving(true);
		try {
			const res = await fetch(`/api/integrations/${apiKey.id}`, {
				method: 'DELETE',
			});
			if (res.ok) {
				setConfirmRemove(false);
				onRefresh();
			}
		} catch {
			// sessizce başarısız ol
		} finally {
			setRemoving(false);
		}
	}

	if (apiKey) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Key className="h-5 w-5 text-green-600 dark:text-green-400" />
						<div>
							<p className="text-sm font-medium text-zinc-900 dark:text-white">
								{t('saved')}
							</p>
							{apiKey.last_used && (
								<p className="text-xs text-zinc-500 dark:text-zinc-400">
									{t('lastUsed', {
										date: new Date(apiKey.last_used).toLocaleDateString(),
									})}
								</p>
							)}
						</div>
					</div>

					{!confirmRemove ? (
						<button
							type="button"
							onClick={() => setConfirmRemove(true)}
							className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
						>
							<Trash2 className="h-4 w-4" />
							{t('remove')}
						</button>
					) : (
						<div className="flex items-center gap-2">
							<span className="text-sm text-zinc-500 dark:text-zinc-400">
								{t('confirmRemove')}
							</span>
							<button
								type="button"
								onClick={handleRemove}
								disabled={removing}
								className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
							>
								{removing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
								Yes
							</button>
							<button
								type="button"
								onClick={() => setConfirmRemove(false)}
								className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
							>
								No
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<label
					htmlFor={`api-key-${provider}`}
					className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
				>
					{t('label')}
				</label>
				<div className="relative">
					<input
						id={`api-key-${provider}`}
						type={showKey ? 'text' : 'password'}
						value={keyValue}
						onChange={(e) => setKeyValue(e.target.value)}
						placeholder={t('placeholder')}
						className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
					/>
					<button
						type="button"
						onClick={() => setShowKey(!showKey)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
						aria-label={showKey ? 'Hide API key' : 'Show API key'}
					>
						{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
					</button>
				</div>
			</div>

			<button
				type="button"
				onClick={handleSave}
				disabled={saving || !keyValue.trim()}
				className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
			>
				{saving ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Key className="h-4 w-4" />
				)}
				{t('save')}
			</button>
		</div>
	);
}
