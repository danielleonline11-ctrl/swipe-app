export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    version: 'v0.2',
    env: {
      APPLE_ID: process.env.APPLE_ID ? `${process.env.APPLE_ID.slice(0, 3)}…@${process.env.APPLE_ID.split('@')[1] || '?'}` : null,
      APPLE_APP_PASSWORD: process.env.APPLE_APP_PASSWORD ? `••• (${process.env.APPLE_APP_PASSWORD.length} chars)` : null,
    },
    node: process.version,
    region: process.env.VERCEL_REGION || 'unknown',
    deployedAt: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  })
}
