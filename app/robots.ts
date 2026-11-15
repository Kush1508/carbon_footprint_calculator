import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://carbonfootprintcalculator-two.vercel.app';

  return {
    rules: [
      {
        userAgent: [
          '*',
          'Googlebot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'PerplexityBot',
          'Google-Extended',
          'Applebot',
          'Bingbot',
        ],
        allow: ['/', '/api/calculate', '/llms.txt', '/openapi.json'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
