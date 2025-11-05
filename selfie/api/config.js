// api/config.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Return environment variables to frontend
    const config = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      GOOGLE_SCOPES: process.env.GOOGLE_SCOPES || 'https://www.googleapis.com/auth/photoslibrary.appendonly'
    };

    // Validate required variables
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_API_KEY) {
      return res.status(500).json({ 
        message: 'Server configuration error',
        error: 'Missing required environment variables: GOOGLE_CLIENT_ID and GOOGLE_API_KEY must be set in Vercel' 
      });
    }

    return res.status(200).json(config);
  } catch (error) {
    console.error('Config API error:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
}
