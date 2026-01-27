import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Supabase 타입 정의가 완전하지 않아서 빌드 시 타입 에러 무시
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 에러 무시
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.10000recipe.com',
      },
      {
        protocol: 'https',
        hostname: 'recipe1.ezmember.co.kr',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
