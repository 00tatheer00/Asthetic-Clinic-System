import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/treatments',
          '/products',
          '/book',
          '/gallery',
          '/about',
          '/reviews',
          '/contact',
          '/privacy',
          '/terms',
          '/images/',
          '/icons/',
          '/llms.txt',
        ],
        disallow: [
          '/dashboard/',
          '/dashboard/*',
          '/auth/',
          '/auth/*',
          '/api/',
          '/api/*',
          '/_next/',
          '/_next/*',
        ],
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'Applebot',
          'DuckDuckBot',
          'Yandex',
          'Baiduspider',
        ],
        allow: '/',
        disallow: ['/dashboard/', '/auth/', '/api/'],
      },
      // Generative Engine Optimization (GEO) & AI Search Agents
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'Bytespider',
          'cohere-ai',
        ],
        allow: ['/', '/treatments', '/products', '/about', '/reviews', '/contact', '/llms.txt'],
        disallow: ['/dashboard/', '/auth/', '/api/'],
      },
      // Social crawlers for rich preview cards
      {
        userAgent: [
          'facebookexternalhit',
          'Twitterbot',
          'LinkedInBot',
          'WhatsApp',
          'TelegramBot',
        ],
        allow: '/',
        disallow: ['/dashboard/', '/auth/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
