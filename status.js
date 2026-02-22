export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(200).json({
        success: true,
        status: 'online',
        message: 'TikTok Downloader API by YAMA',
        version: '1.0.0',
        environment: process.env.VERCEL_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            download: {
                method: 'POST',
                url: '/api/download',
                body: {
                    url: 'URL TikTok yang ingin didownload'
                }
            },
            status: {
                method: 'GET',
                url: '/api/status'
            }
        }
    });
}
