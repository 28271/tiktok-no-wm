import axios from "axios";
import * as cheerio from "cheerio";

export default class TikTokioScraper {
  constructor(options = {}) {
    this.baseURL = "https://tiktokio.com/api/v1/tk/html";
    this.prefix = options.prefix || "tiktokio.com";
    this.headers = options.headers || {
      accept: "*/*",
      "accept-language": "ms-MY",
      "cache-control": "no-cache",
      "content-type": "application/json",
      origin: "https://tiktokio.com",
      pragma: "no-cache",
      referer: "https://tiktokio.com/",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36"
    };
  }

  decode(url) {
    return url ? url.replace(/&#38;/g, "&") : null;
  }

  parseHtml(html) {
    const $ = cheerio.load(html);

    const result = {
      title: null,
      cover: null,
      images: [],
      videos: {
        nowm: null,
        nowm_hd: null,
        wm: null
      },
      mp3: null
    };

    // TITLE
    result.title = $(".video-info h3").first().text().trim() || null;

    // COVER
    const cover = $(".video-info > img").attr("src");
    result.cover = this.decode(cover);

    // IMAGE GRID
    $(".images-grid .image-item").each((i, el) => {
      let url =
        $(el).find("a").attr("href") ||
        $(el).find("img").attr("src");

      url = this.decode(url);

      if (url) {
        result.images.push({
          index: i + 1,
          url
        });
      }
    });

    // DOWNLOAD LINKS
    $(".download-links a").each((_, el) => {
      const text = $(el).text().toLowerCase();
      let href = this.decode($(el).attr("href"));
      if (!href) return;

      if (text.includes("without watermark") && text.includes("hd")) {
        result.videos.nowm_hd = href;
      } else if (text.includes("without watermark")) {
        result.videos.nowm = href;
      } else if (text.includes("watermark")) {
        result.videos.wm = href;
      } else if (text.includes("mp3")) {
        result.mp3 = href;
      }
    });

    return result;
  }

  async fetch(vidUrl) {
    try {
      const response = await axios.post(
        this.baseURL,
        {
          vid: vidUrl,
          prefix: this.prefix
        },
        {
          headers: this.headers,
          timeout: 15000 // 15 detik timeout
        }
      );

      return this.parseHtml(response.data);
    } catch (error) {
      console.error('Error fetching from TikTokio:', error.message);
      throw error;
    }
  }
}
