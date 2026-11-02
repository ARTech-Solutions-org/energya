import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
    const bucket = process.env.R2_BUCKET || 'energya';

    if (!accessKeyId || !secretAccessKey) {
      return res.status(200).json({
        ok: false,
        error: 'Missing R2 environment variables in Vercel settings (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)',
      });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    const result = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
    return res.status(200).json({
      ok: true,
      bucket,
      keyCount: result.KeyCount ?? 0,
      message: `Connected successfully to R2 bucket "${bucket}"`,
    });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      error: err.message || 'Connection failed',
    });
  }
}
