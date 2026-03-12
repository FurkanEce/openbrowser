import { executeRun } from './runner';

const PORT = parseInt(process.env.PORT || '8080', 10);
const WORKER_SECRET = process.env.WORKER_SECRET;

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);

		// Health check
		if (url.pathname === '/health') {
			return Response.json({ status: 'ok' });
		}

		// Execute a run
		if (url.pathname === '/run' && req.method === 'POST') {
			// Verify secret
			const authHeader = req.headers.get('authorization');
			if (WORKER_SECRET && authHeader !== `Bearer ${WORKER_SECRET}`) {
				return Response.json({ error: 'Unauthorized' }, { status: 401 });
			}

			const body = await req.json() as { runId: string };
			if (!body.runId) {
				return Response.json({ error: 'runId is required' }, { status: 400 });
			}

			// Await execution — keep HTTP request open so Cloud Run doesn't kill CPU
			try {
				await executeRun(body.runId);
				return Response.json({ status: 'completed', runId: body.runId }, { status: 200 });
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`[worker] run ${body.runId} failed:`, message);
				return Response.json({ status: 'failed', runId: body.runId, error: message }, { status: 500 });
			}
		}

		return Response.json({ error: 'Not found' }, { status: 404 });
	},
});

console.log(`[worker] listening on port ${server.port}`);
