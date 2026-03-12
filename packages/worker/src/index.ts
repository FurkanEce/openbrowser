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

			// Start execution in background — respond immediately
			executeRun(body.runId).catch((err) => {
				console.error(`[worker] run ${body.runId} failed:`, err);
			});

			return Response.json({ status: 'accepted', runId: body.runId }, { status: 202 });
		}

		return Response.json({ error: 'Not found' }, { status: 404 });
	},
});

console.log(`[worker] listening on port ${server.port}`);
