// api/google-photos-upload.js  
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Serverless Environment Variables से access
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_SCOPES = process.env.GOOGLE_SCOPES;

  const { uploadToken, filename, accessToken } = req.body;

  if (!uploadToken || !filename || !accessToken) {
    return res.status(400).json({ 
      message: 'Missing required parameters: uploadToken, filename, or accessToken' 
    });
  }

  // Validate environment variables
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
    return res.status(500).json({ 
      message: 'Server configuration error',
      error: 'Missing required environment variables in Vercel settings' 
    });
  }

  try {
    // Create media item using the uploadToken
    const createResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        newMediaItems: [{
          description: `Selfie captured by Smart Selfie Camera on ${new Date().toLocaleString()}`,
          simpleMediaItem: {
            fileName: filename,
            uploadToken: uploadToken 
          }
        }]
      })
    });

    if (!createResponse.ok) {
      const errorJson = await createResponse.json();
      console.error('Google Photos API Error:', errorJson);
      return res.status(createResponse.status).json({ 
        message: 'Failed to create media item', 
        error: errorJson 
      });
    }

    const result = await createResponse.json();

    if (result.newMediaItemResults && result.newMediaItemResults.length > 0 && result.newMediaItemResults[0].mediaItem) {
      return res.status(200).json({ 
        message: 'Photo uploaded to Google Photos successfully!', 
        mediaItem: result.newMediaItemResults[0].mediaItem 
      });
    } else if (result.newMediaItemResults && result.newMediaItemResults[0].status) {
      return res.status(500).json({ 
        message: 'Google Photos API error', 
        error: result.newMediaItemResults[0].status 
      });
    } else {
      return res.status(500).json({ 
        message: 'Unexpected Google Photos API response',
        result: result 
      });
    }
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
}
