// api/config.js - Vercel Serverless Function
export default function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get environment variables from Vercel
  const config = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    apiKey: process.env.GOOGLE_API_KEY,
    discoveryDocDrive: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    discoveryDocPhotos: 'https://photoslibrary.googleapis.com/$discovery/rest?version=v1',
    scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/photoslibrary.appendonly'
  };


  // Validate that environment variables are set
  if (!config.clientId || !config.apiKey) {
    return res.status(500).json({ 
      error: 'Server configuration error: Missing API credentials' 
    });
  }

  // Return configuration to frontend
  res.status(200).json(config);
}
