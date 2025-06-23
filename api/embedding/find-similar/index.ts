export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Your actual logic here
  res.status(200).json({ message: 'POST method works for find-similar!' });
} 