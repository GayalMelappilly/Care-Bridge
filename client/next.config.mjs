/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.100',
    'http://localhost:3000',
    'http://192.168.1.100:3000'
  ],
};

export default nextConfig;
