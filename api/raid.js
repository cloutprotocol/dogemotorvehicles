let currentRaid = {
  name: 'No Active Raid',
  url: '#'
};

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(currentRaid);
  }
  
  if (req.method === 'POST') {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL required' });
    }
    
    currentRaid = { name, url };
    return res.json({ success: true });
  }
} 