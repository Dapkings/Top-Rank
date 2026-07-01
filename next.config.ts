import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <--- Setingan wajib Docker di sini, Bang!
  /* Jika sebelumnya sudah ada konfigurasi lain di dalam sini, biarkan saja */
};

export default nextConfig;