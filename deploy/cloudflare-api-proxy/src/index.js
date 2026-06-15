const API_PREFIX = '/api/'
const ALLOWED_METHODS = new Set(['GET', 'POST', 'OPTIONS'])

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowedOrigin = env.ALLOWED_ORIGIN

  if (!origin || !allowedOrigin || origin !== allowedOrigin) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

function proxyUrl(request, backendOrigin) {
  const incomingUrl = new URL(request.url)
  const backendUrl = new URL(backendOrigin)

  backendUrl.pathname = incomingUrl.pathname
  backendUrl.search = incomingUrl.search
  return backendUrl
}

function proxyRequest(request, backendOrigin) {
  return new Request(proxyUrl(request, backendOrigin), request)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const cors = corsHeaders(request, env)

    if (!url.pathname.startsWith(API_PREFIX)) {
      return jsonResponse({ error: 'not found' }, { status: 404, headers: cors })
    }

    if (!ALLOWED_METHODS.has(request.method)) {
      return jsonResponse(
        { error: 'method not allowed' },
        {
          status: 405,
          headers: {
            Allow: 'GET, POST, OPTIONS',
            ...cors,
          },
        },
      )
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: Object.keys(cors).length > 0 ? 204 : 403,
        headers: cors,
      })
    }

    if (!env.BACKEND_ORIGIN) {
      return jsonResponse(
        { error: 'BACKEND_ORIGIN is not configured' },
        { status: 500, headers: cors },
      )
    }

    const upstreamResponse = await fetch(proxyRequest(request, env.BACKEND_ORIGIN))
    const response = new Response(upstreamResponse.body, {
      headers: upstreamResponse.headers,
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
    })

    for (const [key, value] of Object.entries(cors)) {
      response.headers.set(key, value)
    }

    return response
  },
}
