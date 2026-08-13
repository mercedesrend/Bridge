import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./frontend/index.html", "./pitch/index.html"],
    "/pitch": ["./pitch/index.html"],
  },
};

export default nextConfig;
