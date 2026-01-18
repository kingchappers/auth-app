import { verify } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || '';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || '';

// Create JWKS client to fetch Auth0's public keys
const client = jwksClient({
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
});

async function getKey(header: any) {
  const key = await client.getSigningKey(header.kid);
  return key.getPublicKey();
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authorization token' }),
      };
    }

    // Verify and decode JWT
    const decoded = await new Promise((resolve, reject) => {
      verify(token, getKey, { audience: AUTH0_AUDIENCE }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    // Route requests based on path
    const path = event.rawPath;

    if (path === '/api/test') {
      return handleTestEndpoint(decoded);
    }

    if (path === '/api/user-info') {
      return handleUserInfo(decoded);
    }

    // 404 for unknown endpoints
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }
};

function handleTestEndpoint(decoded: any) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello from protected API',
      userId: decoded.sub,
      timestamp: new Date().toISOString(),
    }),
  };
}

function handleUserInfo(decoded: any) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: decoded.sub,
      email: decoded[`${process.env.AUTH0_DOMAIN}/email`] || decoded.email,
      name: decoded[`${process.env.AUTH0_DOMAIN}/name`] || decoded.name,
    }),
  };
}
