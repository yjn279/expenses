// Environment variables interface
interface WorkerEnv {
  BASIC_AUTH_USERS?: string; // Format: user1:pass1,user2:pass2
  GAS_API_URL?: string; // Google Apps Script deployed URL
}

// Parse Basic auth credentials from environment
function parseAuthUsers(authString: string | undefined): Map<string, string> {
  const users = new Map<string, string>();
  if (!authString) return users;

  authString.split(',').forEach((pair) => {
    const [username, password] = pair.split(':');
    if (username && password) {
      users.set(username.trim(), password.trim());
    }
  });
  return users;
}

// Validate Basic authentication
function validateBasicAuth(
  request: Request,
  validUsers: Map<string, string>
): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');

    return validUsers.get(username) === password;
  } catch {
    return false;
  }
}

// Create 401 Unauthorized response
function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Expenses Dashboard"',
      'Content-Type': 'text/plain',
    },
  });
}

// Handle GET request - proxy to GAS API
async function handleGet(env: WorkerEnv): Promise<Response> {
  if (!env.GAS_API_URL) {
    return Response.json(
      { success: false, error: 'GAS_API_URL not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(env.GAS_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Failed to parse GAS response:', text);
      return Response.json(
        { success: false, error: 'Invalid JSON from GAS API', raw: text },
        { status: 500 }
      );
    }

    // Check if response already has success field, if not wrap it
    if (!data.success && !data.error) {
      return Response.json(
        { success: true, data: data },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    return Response.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { success: false, error: `Failed to fetch from GAS: ${message}` },
      { status: 500 }
    );
  }
}

// Handle POST request - proxy to GAS API
async function handlePost(request: Request, env: WorkerEnv): Promise<Response> {
  if (!env.GAS_API_URL) {
    return Response.json(
      { success: false, error: 'GAS_API_URL not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();

    const response = await fetch(env.GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    const data = await response.json();
    return Response.json(data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { success: false, error: `Failed to post to GAS: ${message}` },
      { status: 500 }
    );
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    // Only handle /api/* routes
    if (!url.pathname.startsWith('/api/')) {
      return new Response(null, { status: 404 });
    }

    // Validate Basic authentication (temporarily disabled for testing)
    // const validUsers = parseAuthUsers(env.BASIC_AUTH_USERS);
    // if (validUsers.size > 0 && !validateBasicAuth(request, validUsers)) {
    //   return unauthorized();
    // }

    // Route based on method
    switch (request.method) {
      case 'GET':
        return handleGet(env);
      case 'POST':
        return handlePost(request, env);
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  },
} satisfies ExportedHandler<WorkerEnv>;
