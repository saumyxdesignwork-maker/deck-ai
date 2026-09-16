import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this app — without it, Turbopack walks up
    // looking for a lockfile and can latch onto an unrelated one higher in
    // the filesystem (e.g. in the user's home directory).
    root: path.join(__dirname),
  },
};

export default nextConfig;
