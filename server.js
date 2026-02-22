import express from 'express';
import cors from 'cors';
import TikTokioScraper from './scraper.js';

const app = express();
const DEFAULT_PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Middleware untuk logging
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

// Endpoint: Download TikTok
app.post('/api/download', async (req, res) => {
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
                message: 'URL TikTok tidak valid. Pastikan URL benar.'
            });
        }

        console.log('🔍 Memproses URL:', url);

        // Inisialisasi scraper
        const scraper = new TikTokioScraper();
        
        // Fetch data dari TikTok
        console.log('⏳ Mengambil data dari TikTokio...');
        const result = await scraper.fetch(url);
        
        console.log('✅ Data berhasil diambil');

        // Cek apakah ada hasil
        if (!result.videos.nowm && !result.videos.nowm_hd && !result.videos.wm && !result.mp3 && result.images.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tidak dapat menemukan konten. Mungkin URL salah atau video private.'
            });
        }

        // Kirim response sukses
        res.json({
            success: true,
            message: 'Berhasil mengambil data',
            data: result
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Handle error spesifik
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                success: false,
                message: 'Gagal terhubung ke layanan TikTok. Coba lagi nanti.'
            });
        }

        if (error.response) {
            // Error dari API TikTokio
            console.error('API Response Error:', {
                status: error.response.status,
                data: error.response.data
            });

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
            // Request dibuat tapi tidak ada response
            return res.status(504).json({
                success: false,
                message: 'Tidak ada response dari layanan TikTok. Timeout?'
            });
        }

        // Error lainnya
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan internal server',
            error: error.message
        });
    }
});

// Endpoint: Cek status server
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        message: 'TikTok Downloader API by YAMA',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            download: 'POST /api/download',
            status: 'GET /api/status'
        }
    });
});

// Endpoint: Root - Info API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'TikTok Downloader API',
        author: 'YAMA',
        description: 'API untuk mendownload video TikTok tanpa watermark',
        endpoints: {
            download: {
                method: 'POST',
                url: '/api/download',
                body: {
                    url: 'URL TikTok yang ingin didownload'
                },
                example: {
                    url: 'https://vt.tiktok.com/ZSrJxqY5S/'
                }
            },
            status: {
                method: 'GET',
                url: '/api/status',
                description: 'Cek status server'
            }
        }
    });
});

// Handle 404 untuk API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint API tidak ditemukan'
    });
});

// Handle 404 untuk routes lainnya (akan di-handle oleh frontend)
app.use((req, res) => {
    res.status(404).sendFile('public/index.html', { root: '.' });
});

// Fungsi untuk mencari port yang tersedia
function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = app.listen(startPort, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`⚠️ Port ${startPort} sudah digunakan, mencoba port ${startPort + 1}...`);
                resolve(findAvailablePort(startPort + 1));
            } else {
                reject(err);
            }
        });
    });
}

// Start server dengan port otomatis
async function startServer() {
    try {
        console.log('🚀 Mencari port yang tersedia...');
        const port = await findAvailablePort(DEFAULT_PORT);
        
        // Restart server dengan port yang ditemukan
        app.listen(port, () => {
            console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║     ████████╗██╗██╗  ██╗████████╗ ██████╗ ██╗  ██╗     ║
    ║     ╚══██╔══╝██║██║ ██╔╝╚══██╔══╝██╔═══██╗██║ ██╔╝     ║
    ║        ██║   ██║█████╔╝    ██║   ██║   ██║█████╔╝      ║
    ║        ██║   ██║██╔═██╗    ██║   ██║   ██║██╔═██╗      ║
    ║        ██║   ██║██║  ██╗   ██║   ╚██████╔╝██║  ██╗     ║
    ║        ╚═╝   ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝     ║
    ║                                                          ║
    ║            TikTok Downloader API by YAMA                 ║
    ║                                                          ║
    ╠══════════════════════════════════════════════════════════╣
    ║                                                          ║
    ║  🚀 Server:   http://localhost:${port}                      ║
    ║  📁 Frontend: http://localhost:${port}                      ║
    ║  🔌 API:      http://localhost:${port}/api                  ║
    ║                                                          ║
    ║  📌 Endpoints:                                           ║
    ║     • GET  /api/status    - Cek status server           ║
    ║     • POST /api/download   - Download TikTok             ║
    ║     • GET  /api           - Info API                     ║
    ║                                                          ║
    ║  ⚡ Mode: ${process.env.NODE_ENV || 'development'}                          ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Gagal menjalankan server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

// Start server
startServer();