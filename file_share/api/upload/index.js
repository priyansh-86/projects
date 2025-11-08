// FILE: api/upload/index.js
// Yeh hamara Vercel backend hai (Node.js runtime)
import { put } from '@vercel/blob';

export default async function handler(request, response) {
  // Sirf POST method allow karo
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Query parameter se filename nikalo
    const { filename } = request.query;
    
    if (!filename) {
      return response.status(400).json({ message: 'Filename is required' });
    }

    // Request body se file data nikalo
    // 'request' yahaan Vercel ka Node.js request object hai
    const fileBuffer = request.body;
    
    if (!fileBuffer) {
      return response.status(400).json({ message: 'No file data found' });
    }

    // Vercel Blob par upload karo
    // Token environment variable se apne aap aa jaayega
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN, // Environment variable se token
    });

    // Success response bhejo
    return response.status(200).json({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return response.status(500).json({ 
      message: 'Upload failed', 
      error: error.message 
    });
  }
}

// Important: Body parser disable karo kyunki hum raw data chahiye
export const config = {
  api: {
    bodyParser: false,
  },
};