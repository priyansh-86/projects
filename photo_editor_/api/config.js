// Yeh ek Vercel Serverless Function hai
// Yeh server par chalta hai, browser mein nahi

export default function handler(request, response) {
  // Yahaan hum Vercel ke Environment Variable ko padh rahe hain
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    // Agar variable set nahi hai toh error bhej do
    return response.status(500).json({
      error: 'GOOGLE_CLIENT_ID environment variable is not set.',
    });
  }

  // Agar sab theek hai, toh Client ID ko frontend par bhej do
  response.status(200).json({
    clientId: clientId,
  });
}