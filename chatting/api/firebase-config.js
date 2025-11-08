
// api/firebase-config.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'GET') {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || ''
    };
    
    // Validate config (without logging sensitive data)
    const hasAllFields = Object.values(firebaseConfig).every(value => value !== '');
    
    if (!hasAllFields) {
      return res.status(500).json({
        error: 'Firebase configuration incomplete',
        status: 'error'
      });
    }
    
    // Send config (Firebase will use it internally)
    res.status(200).json({
      firebaseConfig: firebaseConfig,
      status: 'success'
      // Don't log timestamp or any debug info
    });
    
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
