export type Provider = 'openai' | 'anthropic' | 'google';

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type SessionStatus = 'active' | 'idle' | 'terminated';

export type ConnectionMethod = 'oauth' | 'api_key';

export interface ApiKeyRecord {
	id: string;
	user_id: string;
	provider: Provider;
	encrypted_key: string;
	iv: string;
	label: string | null;
	last_used: string | null;
	created_at: string;
	updated_at: string;
}

export interface OAuthConnection {
	id: string;
	user_id: string;
	provider: Provider;
	access_token: string;
	refresh_token: string | null;
	expires_at: string | null;
	scope: string | null;
	created_at: string;
	updated_at: string;
}

export interface AgentRun {
	id: string;
	user_id: string;
	task: string;
	model: string;
	provider: Provider;
	status: RunStatus;
	result: string | null;
	error_message: string | null;
	total_steps: number;
	total_input_tokens: number;
	total_output_tokens: number;
	total_cost_usd: number | null;
	agent_config: Record<string, unknown> | null;
	started_at: string | null;
	completed_at: string | null;
	created_at: string;
}

export interface AgentStep {
	id: string;
	run_id: string;
	step_number: number;
	url: string | null;
	agent_output: Record<string, unknown>;
	action_results: Record<string, unknown>[];
	input_tokens: number;
	output_tokens: number;
	duration_ms: number;
	error: string | null;
	screenshot_url: string | null;
	created_at: string;
}

export interface BrowserSession {
	id: string;
	user_id: string;
	run_id: string | null;
	status: SessionStatus;
	browser_info: Record<string, unknown> | null;
	started_at: string;
	ended_at: string | null;
}

export interface UsageRecord {
	id: string;
	user_id: string;
	date: string;
	model: string;
	input_tokens: number;
	output_tokens: number;
	cost_usd: number;
	run_count: number;
}
