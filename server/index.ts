import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import fs from 'fs';
import path from 'path';

const BUILD_DIR = path.join(__dirname, '../build/client');
const INDEX_HTML_PATH = path.join(BUILD_DIR, 'index.html');

/**
 * Lambda handler for React Router SPA application
 * Serves static assets from /build/client and returns index.html for client-side routing.
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const requestPath = event.rawPath || '/';
    
    // Try to serve a static file first (CSS, JS, images, etc.)
    const filePath = path.join(BUILD_DIR, requestPath.replace(/^\//, ''));
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = getContentType(ext);
      const fileContent = fs.readFileSync(filePath);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=31536000',
        },
        body: fileContent.toString('base64'),
        isBase64Encoded: true,
      };
    }
    
    // Serve index.html for all other routes (SPA routing)
    if (fs.existsSync(INDEX_HTML_PATH)) {
      const indexContent = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
        body: indexContent,
      };
    }
    
    // If index.html doesn't exist, return 404
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Not Found',
      }),
    };
  } catch (error) {
    console.error('Error handling request:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

function getContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}
