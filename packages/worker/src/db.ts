import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
	if (_supabase) return _supabase;
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
	}
	_supabase = createClient(url, key);
	return _supabase;
}

export async function getRun(runId: string) {
	const { data, error } = await getSupabase()
		.from('agent_runs')
		.select('*')
		.eq('id', runId)
		.single();

	if (error) throw new Error(`Failed to fetch run: ${error.message}`);
	return data;
}

export async function updateRunStatus(
	runId: string,
	status: string,
	extra: Record<string, unknown> = {},
) {
	const { error } = await getSupabase()
		.from('agent_runs')
		.update({ status, ...extra })
		.eq('id', runId);

	if (error) throw new Error(`Failed to update run: ${error.message}`);
}

export async function insertStep(step: {
	run_id: string;
	step_number: number;
	url: string | null;
	agent_output: unknown;
	action_results: unknown;
	input_tokens: number;
	output_tokens: number;
	duration_ms: number;
	error: string | null;
	screenshot_url: string | null;
}) {
	const { error } = await getSupabase().from('agent_steps').insert(step);
	if (error) throw new Error(`Failed to insert step: ${error.message}`);
}

export async function getDecryptedApiKey(
	userId: string,
	provider: string,
): Promise<{ encrypted_key: string; iv: string } | null> {
	const { data, error } = await getSupabase()
		.from('api_keys')
		.select('encrypted_key, iv')
		.eq('user_id', userId)
		.eq('provider', provider)
		.single();

	if (error || !data) return null;
	return data;
}

export async function getOAuthToken(
	userId: string,
	provider: string,
): Promise<{ access_token: string } | null> {
	const { data, error } = await getSupabase()
		.from('oauth_connections')
		.select('access_token')
		.eq('user_id', userId)
		.eq('provider', provider)
		.single();

	if (error || !data) return null;
	return data;
}
