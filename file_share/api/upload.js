// FILE: api/upload.js
// Simple single file upload (ZIP already created by frontend)
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple approach: Read the entire request body as a buffer
    const chunks = [];
    
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = req.headers['content-disposition'] || '';
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : `upload-${Date.now()}.zip`;

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'application/zip',
    });

    return res.status(200).json({ 
      url: blob.url,
      filename: filename
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message
    });
  }
}