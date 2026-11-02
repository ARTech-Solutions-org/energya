import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

function getS3Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials missing. Please set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in Vercel Environment Variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function generateDownloadPageHtml(imageUrl) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Energya Industries — Your Framed Photo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 30%, #0d3870 0%, #071f45 50%, #030e20 100%);
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      text-align: center;
      padding: 24px 16px;
    }
    .card {
      max-width: 480px;
      width: 100%;
      padding: 30px 22px;
      border-radius: 28px;
      background: linear-gradient(165deg, rgba(14, 65, 140, 0.9) 0%, rgba(6, 28, 64, 0.96) 100%);
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6), 0 0 40px rgba(13, 70, 143, 0.3);
      backdrop-filter: blur(14px);
    }
    .logo-wrap {
      display: inline-block;
      padding: 10px 22px;
      background: #ffffff;
      border-radius: 16px;
      margin-bottom: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    }
    .logo { width: 180px; height: auto; display: block; }
    h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
    p { color: rgba(255, 255, 255, 0.75); font-size: 15px; margin-bottom: 20px; line-height: 1.4; }
    .photo-frame { position: relative; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 45px rgba(0, 0, 0, 0.5); margin-bottom: 24px; background: #020b18; }
    .photo { display: block; width: 100%; height: auto; object-fit: contain; }
    .download-btn {
      display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; min-height: 60px; padding: 16px 24px; border-radius: 18px; background: linear-gradient(135deg, #ffffff 0%, #fff2eb 100%); color: #071b3c; text-decoration: none; font-size: 18px; font-weight: 800; box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(255, 118, 84, 0.3);
      transition: transform 0.15s ease;
    }
    .download-btn:active { transform: scale(0.97); }
    .download-icon { font-size: 20px; color: #e8532b; }
    .ios-note { margin-top: 14px; font-size: 13px; color: rgba(255, 255, 255, 0.6); }
    .footer-badge { margin-top: 22px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); font-size: 11px; letter-spacing: 0.12em; font-weight: 700; color: rgba(255, 255, 255, 0.65); text-transform: uppercase; }
  </style>
</head>
<body>
  <main class="card">
    <div class="logo-wrap">
      <img class="logo" src="/new_design/logo.svg" alt="Energya Industries" onerror="this.style.display='none'">
    </div>
    <h1>Your Energya Moment</h1>
    <p>Captured & framed at Energya Industries Photobooth</p>
    <div class="photo-frame">
      <img class="photo" src="${imageUrl}" alt="Your framed photo">
    </div>
    <a class="download-btn" href="${imageUrl}" download="energya-photo.jpg">
      <span class="download-icon">⬇</span>
      <span>Save Photo to Phone</span>
    </a>
    <div class="ios-note">Tip: On iPhone, you can also press & hold the photo to "Save to Photos".</div>
    <div class="footer-badge">Energya Industries · Cairo</div>
  </main>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const match = String(body.image || '').match(/^data:image\/(png|jpeg);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid base64 image data' });

    const ext = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const id = crypto.randomUUID();
    const bucket = process.env.R2_BUCKET || 'energya';

    const s3 = getS3Client();
    const imageKey = `photos/${id}.${ext}`;
    const htmlKey = `photos/${id}.html`;

    // 1. Upload high-res photo to R2
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: imageKey,
        Body: buffer,
        ContentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      })
    );

    // 2. Presigned direct image download URL (valid 7 days)
    const imgDownloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: imageKey,
        ResponseContentDisposition: 'attachment; filename="energya-photo.jpg"',
      }),
      { expiresIn: 604800 }
    );

    // 3. Upload branded HTML download page to R2
    const pageHtml = generateDownloadPageHtml(imgDownloadUrl);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: htmlKey,
        Body: pageHtml,
        ContentType: 'text/html; charset=utf-8',
      })
    );

    // 4. Presign the HTML page URL for the QR code
    const r2Url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: htmlKey,
        ResponseContentType: 'text/html; charset=utf-8',
      }),
      { expiresIn: 604800 }
    );

    return res.status(201).json({
      id,
      ok: true,
      r2Url,
      activeUrl: r2Url,
      localUrl: r2Url,
      syncedToR2: true,
    });
  } catch (err) {
    console.error('Vercel photo upload error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
}

