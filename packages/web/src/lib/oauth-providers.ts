import type { Provider } from '@/types';

interface OAuthProviderConfig {
	authorizeUrl: string;
	tokenUrl: string;
	scopes: string[];
	clientIdEnv: string;
	clientSecretEnv: string;
}

// Sadece Google OAuth destekliyor (üçüncü parti uygulamalar için).
// OpenAI ve Anthropic public OAuth sunmuyor — sadece API key ile erişim var.
const providerConfigs: Partial<Record<Provider, OAuthProviderConfig>> = {
	google: {
		authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		tokenUrl: 'https://oauth2.googleapis.com/token',
		scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		clientIdEnv: 'GOOGLE_AI_OAUTH_CLIENT_ID',
		clientSecretEnv: 'GOOGLE_AI_OAUTH_CLIENT_SECRET',
	},
};

const OAUTH_PROVIDERS: Provider[] = ['google'];

export function isOAuthSupported(provider: Provider): boolean {
	return OAUTH_PROVIDERS.includes(provider);
}

export function getProviderConfig(provider: Provider): OAuthProviderConfig | null {
	return providerConfigs[provider] ?? null;
}

export function isProviderConfigured(provider: Provider): boolean {
	const config = providerConfigs[provider];
	if (!config) return false;
	return !!(process.env[config.clientIdEnv] && process.env[config.clientSecretEnv]);
}

export function getCallbackUrl(provider: Provider, origin: string): string {
	return `${origin}/api/integrations/oauth/${provider}/callback`;
}

export function buildAuthorizeUrl(provider: Provider, origin: string, state: string): string | null {
	const config = providerConfigs[provider];
	if (!config) return null;

	const clientId = process.env[config.clientIdEnv];
	if (!clientId) return null;

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: getCallbackUrl(provider, origin),
		response_type: 'code',
		scope: config.scopes.join(' '),
		state,
		access_type: 'offline',
		prompt: 'consent',
	});

	return `${config.authorizeUrl}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
	provider: Provider,
	code: string,
	origin: string,
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string } | null> {
	const config = providerConfigs[provider];
	if (!config) return null;

	const clientId = process.env[config.clientIdEnv];
	const clientSecret = process.env[config.clientSecretEnv];
	if (!clientId || !clientSecret) return null;

	const res = await fetch(config.tokenUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: getCallbackUrl(provider, origin),
			grant_type: 'authorization_code',
		}),
	});

	if (!res.ok) return null;
	return res.json();
}
