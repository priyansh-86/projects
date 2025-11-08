// FILE: api/upload/route.js
// Yeh hamara Vercel backend hai
import { put } from '@vercel/blob';

export async function POST(request) {
  // filename ko search query se nikal rahe hain
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return new Response(JSON.stringify({ message: 'No file found' }), {
      status: 400,
    });
  }

  try {
    // File ko Vercel Blob par upload kar rahe hain
    const blob = await put(filename, request.body, {
      access: 'public', // Taaki link public ho
    });
    
    // Success response mein blob ka data bhej rahe hain (jismein .url hoga)
    return new Response(JSON.stringify(blob), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return new Response(JSON.stringify({ message: 'Error uploading file', error: error.message }), {
      status: 500,
    });
  }
}