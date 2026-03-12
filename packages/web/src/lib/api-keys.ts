import { createClient } from '@supabase/supabase-js';
import { decrypt, encrypt } from '@/lib/crypto';
import type { ApiKeyRecord, Provider } from '@/types';

function getAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceKey) {
		throw new Error('Missing Supabase admin credentials');
	}

	return createClient(url, serviceKey);
}

export async function saveApiKey(
	userId: string,
	provider: Provider,
	key: string,
	label?: string,
): Promise<ApiKeyRecord> {
	const admin = getAdminClient();
	const { encrypted, iv } = encrypt(key);

	const { data, error } = await admin
		.from('api_keys')
		.upsert(
			{
				user_id: userId,
				provider,
				encrypted_key: encrypted,
				iv,
				label: label ?? null,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: 'user_id,provider' },
		)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to save API key: ${error.message}`);
	}

	return data as ApiKeyRecord;
}

export async function getApiKeys(userId: string): Promise<ApiKeyRecord[]> {
	const admin = getAdminClient();

	const { data, error } = await admin
		.from('api_keys')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch API keys: ${error.message}`);
	}

	return (data ?? []) as ApiKeyRecord[];
}

export async function getDecryptedKey(
	userId: string,
	provider: Provider,
): Promise<string | null> {
	const admin = getAdminClient();

	const { data, error } = await admin
		.from('api_keys')
		.select('encrypted_key, iv')
		.eq('user_id', userId)
		.eq('provider', provider)
		.single();

	if (error || !data) {
		return null;
	}

	return decrypt(data.encrypted_key, data.iv);
}

export async function removeApiKey(
	userId: string,
	provider: Provider,
): Promise<void> {
	const admin = getAdminClient();

	const { error } = await admin
		.from('api_keys')
		.delete()
		.eq('user_id', userId)
		.eq('provider', provider);

	if (error) {
		throw new Error(`Failed to remove API key: ${error.message}`);
	}
}
