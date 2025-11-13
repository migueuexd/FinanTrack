import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const baseConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

const isDev = process.env.NODE_ENV !== 'production';

const pwaConfig = withPWA({
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  runtimeCaching: [],
})(baseConfig);

export default pwaConfig;
