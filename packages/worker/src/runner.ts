import { Agent, Viewport, VercelModelAdapter } from 'open-browser';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
	getRun,
	updateRunStatus,
	insertStep,
	getDecryptedApiKey,
	getOAuthToken,
} from './db';
import { decrypt } from './crypto';

type Provider = 'openai' | 'anthropic' | 'google';

function createModel(provider: Provider, modelId: string, apiKey: string) {
	switch (provider) {
		case 'openai': {
			const openai = createOpenAI({ apiKey });
			return new VercelModelAdapter({ model: openai(modelId) });
		}
		case 'anthropic': {
			const anthropic = createAnthropic({ apiKey });
			return new VercelModelAdapter({ model: anthropic(modelId) });
		}
		case 'google': {
			const google = createGoogleGenerativeAI({ apiKey });
			return new VercelModelAdapter({ model: google(modelId) });
		}
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

async function resolveApiKey(userId: string, provider: Provider): Promise<string> {
	// API key'i dene
	const keyData = await getDecryptedApiKey(userId, provider);
	if (keyData) {
		return decrypt(keyData.encrypted_key, keyData.iv);
	}

	// OAuth token'ı dene (Google için)
	const oauthData = await getOAuthToken(userId, provider);
	if (oauthData) {
		// OAuth token da şifreli saklanıyor: "encrypted:iv" formatında
		const [encrypted, iv] = oauthData.access_token.split(':');
		if (encrypted && iv) {
			return decrypt(encrypted, iv);
		}
	}

	throw new Error(`No API key or OAuth token found for ${provider}`);
}

export async function executeRun(runId: string): Promise<void> {
	console.log(`[runner] starting run ${runId}`);

	const run = await getRun(runId);
	if (!run) throw new Error(`Run ${runId} not found`);
	if (run.status !== 'pending') {
		console.log(`[runner] run ${runId} is ${run.status}, skipping`);
		return;
	}

	const provider = run.provider as Provider;
	const config = (run.agent_config ?? {}) as { max_steps?: number; headless?: boolean };
	const startTime = Date.now();

	// Durumu "running" yap
	await updateRunStatus(runId, 'running', {
		started_at: new Date().toISOString(),
	});

	let browser: Viewport | null = null;

	try {
		// API key çöz
		const apiKey = await resolveApiKey(run.user_id, provider);

		// Model oluştur
		const model = createModel(provider, run.model, apiKey);

		// Tarayıcı başlat (Cloud Run optimizasyonları)
		browser = new Viewport({
			headless: true,
			launchOptions: {
				extraArgs: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-gpu',
				],
				relaxedSecurity: true,
			},
		});
		await browser.start();

		// Step sayaçları
		let totalInputTokens = 0;
		let totalOutputTokens = 0;
		let stepCount = 0;

		// Agent oluştur ve çalıştır
		const agent = new Agent({
			task: run.task,
			model,
			browser,
			settings: {
				stepLimit: config.max_steps ?? 50,
				enableScreenshots: true,
			},
			onStepEnd: async (step, results) => {
				stepCount = step;
				try {
					// Adım bilgisini DB'ye yaz
					const currentState = await browser?.getState().catch(() => null);
					const stepInputTokens = 0; // Agent callback'ten detaylı bilgi yok
					const stepOutputTokens = 0;

					await insertStep({
						run_id: runId,
						step_number: step,
						url: currentState?.url ?? null,
						agent_output: {},
						action_results: results.map((r) => ({
							success: r.success,
							extractedContent: r.extractedContent,
							error: r.error,
						})),
						input_tokens: stepInputTokens,
						output_tokens: stepOutputTokens,
						duration_ms: 0,
						error: results.find((r) => r.error)?.error ?? null,
						screenshot_url: null,
					});

					// Run toplamlarını güncelle
					await updateRunStatus(runId, 'running', {
						total_steps: step,
						total_input_tokens: totalInputTokens,
						total_output_tokens: totalOutputTokens,
					});
				} catch (err) {
					console.error(`[runner] failed to save step ${step}:`, err);
				}
			},
		});

		const result = await agent.run(config.max_steps ?? 50);

		// Sonuçları kaydet
		totalInputTokens = result.history.totalInputTokens;
		totalOutputTokens = result.history.totalOutputTokens;
		const totalCost = result.totalCost?.totalCost ?? 0;

		await updateRunStatus(runId, result.success ? 'completed' : 'failed', {
			result: result.finalResult ?? null,
			error_message: result.errors.length > 0 ? result.errors.join('\n') : null,
			total_steps: result.history.totalSteps,
			total_input_tokens: totalInputTokens,
			total_output_tokens: totalOutputTokens,
			total_cost_usd: totalCost,
			completed_at: new Date().toISOString(),
		});

		console.log(`[runner] run ${runId} ${result.success ? 'completed' : 'failed'} in ${result.history.totalSteps} steps`);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error(`[runner] run ${runId} error:`, errorMessage);

		await updateRunStatus(runId, 'failed', {
			error_message: errorMessage,
			completed_at: new Date().toISOString(),
		}).catch(() => {});
	} finally {
		if (browser) {
			await browser.close().catch(() => {});
		}
	}
}
