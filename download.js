import TikTokioScraper from '../scraper.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { url } = req.body;

        // Validasi URL
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL tidak boleh kosong'
            });
        }

        // Validasi format URL TikTok
        const tikTokPattern = /(tiktok\.com|vt\.tiktok\.com)\/.+/;
        if (!tikTokPattern.test(url)) {
            return res.status(400).json({
                success: false,
                message: 'URL TikTok tidak valid. Contoh: https://vt.tiktok.com/ZSrJxqY5S/'
            });
        }

        console.log('🔍 [Vercel] Memproses URL:', url);

        // Inisialisasi scraper
        const scraper = new TikTokioScraper();
        
        // Fetch data dari TikTok
        console.log('⏳ [Vercel] Mengambil data...');
        const result = await scraper.fetch(url);
        
        console.log('✅ [Vercel] Data berhasil diambil');

        // Cek apakah ada hasil
        if (!result.videos.nowm && !result.videos.nowm_hd && !result.videos.wm && !result.mp3 && result.images.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tidak dapat menemukan konten. Mungkin URL salah atau video private.'
            });
        }

        // Kirim response sukses
        return res.status(200).json({
            success: true,
            message: 'Berhasil mengambil data',
            data: result
        });

    } catch (error) {
        console.error('❌ [Vercel] Error:', error.message);
        
        // Handle error spesifik
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                success: false,
                message: 'Gagal terhubung ke layanan TikTok. Coba lagi nanti.'
            });
        }

        if (error.response) {
            if (error.response.status === 404) {
                return res.status(404).json({
                    success: false,
                    message: 'Video tidak ditemukan di TikTok'
                });
            }

            return res.status(error.response.status || 500).json({
                success: false,
                message: `Layanan TikTok mengembalikan error: ${error.response.status}`,
                error: error.message
            });
        }

        if (error.request) {
            return res.status(504).json({
                success: false,
                message: 'Tidak ada response dari layanan TikTok. Mungkin timeout.'
            });
        }

        // Error lainnya
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan internal server',
            error: error.message
        });
    }
}
