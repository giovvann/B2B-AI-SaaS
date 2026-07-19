// @ts-check
import withSerwistInit from "@serwist/next";

const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSerwist(nextConfig);