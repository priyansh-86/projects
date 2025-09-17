export default function handler(req, res) {
    const config = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        apiKey: process.env.GOOGLE_API_KEY
    };
    
    res.status(200).json(config);
}
