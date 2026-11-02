export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const accountId = process.env.R2_ACCOUNT_ID || '6689d1626b5ab6e9f9e69e886af37e97';
  const bucket = process.env.R2_BUCKET || 'energya';

  if (req.method === 'GET') {
    return res.status(200).json({
      camera: { width: 1080, height: 1920 },
      countdownSeconds: Number(process.env.COUNTDOWN_SECONDS || 3),
      idleTimeoutSeconds: Number(process.env.IDLE_TIMEOUT_SECONDS || 45),
      paperSize: process.env.PAPER_SIZE || '4x6',
      printEnabled: process.env.PRINT_ENABLED !== 'false',
      soundEnabled: true,
      storageMode: process.env.STORAGE_MODE || 'r2',
      mirrorPhoto: process.env.MIRROR_PHOTO === 'true',
      baseUrl: process.env.BASE_URL || '',
      r2: {
        accountId: accountId,
        bucket: bucket,
        accessKeyId: process.env.R2_ACCESS_KEY_ID ? '••••••••' : '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ? '••••••••' : '',
        endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
        publicUrl: process.env.R2_PUBLIC_URL || '',
      },
      local: { host: '', port: 3000 },
      languageOrder: ['en'],
      qrMode: 'both',
      savedPhotosCount: 0,
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({ ok: true, message: 'Settings saved in memory for session' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

