/**
 * Cloudflare Worker for Todo App Storage
 * Replaces localStorage with Cloudflare KV storage
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// Enable CORS for all requests
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle preflight requests
		if (method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// API Routes
		if (path.startsWith('/api/storage/')) {
			const key = path.replace('/api/storage/', '');
			
			try {
				switch (method) {
					case 'GET':
						return await handleGet(env.TODO_STORAGE, key, corsHeaders);
					
					case 'POST':
					case 'PUT':
						return await handleSet(env.TODO_STORAGE, key, request, corsHeaders);
					
					case 'DELETE':
						return await handleDelete(env.TODO_STORAGE, key, corsHeaders);
					
					default:
						return new Response('Method not allowed', { 
							status: 405, 
							headers: corsHeaders 
						});
				}
			} catch (error) {
				return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, { 
					status: 500, 
					headers: corsHeaders 
				});
			}
		}

		// Default response for non-API routes - serve static assets
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;

async function handleGet(storage: KVNamespace, key: string, corsHeaders: Record<string, string>): Promise<Response> {
	const value = await storage.get(key);
	
	if (value === null) {
		return new Response('null', { 
			headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
		});
	}
	
	return new Response(value, { 
		headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
	});
}

async function handleSet(storage: KVNamespace, key: string, request: Request, corsHeaders: Record<string, string>): Promise<Response> {
	const body = await request.text();
	
	await storage.put(key, body);
	
	return new Response('OK', { headers: corsHeaders });
}

async function handleDelete(storage: KVNamespace, key: string, corsHeaders: Record<string, string>): Promise<Response> {
	await storage.delete(key);
	
	return new Response('OK', { headers: corsHeaders });
}
