import { put } from '@vercel/blob';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
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
    const form = formidable({});
    
    const [fields, files] = await form.parse(req);
    
    console.log('Fields:', fields);
    console.log('Files:', files);

    const file = files.file?.[0];
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype
    });

    // Read file
    const fs = await import('fs/promises');
    const fileBuffer = await fs.readFile(file.filepath);

    console.log('Buffer size:', fileBuffer.length);

    // Upload to Blob
    const blob = await put(file.originalFilename, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('Upload success:', blob.url);

    return res.status(200).json({ url: blob.url });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
}