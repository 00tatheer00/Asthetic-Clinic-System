import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Unique deployment identifier generated during server startup/build
const SERVER_START_TIME = new Date().toISOString();
const BUILD_IDENTIFIER =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.BUILD_ID ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  `build-${SERVER_START_TIME}`;

export async function GET() {
  const versionData = {
    version: BUILD_IDENTIFIER,
    buildTime: SERVER_START_TIME,
    environment: process.env.NODE_ENV || 'production',
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    serverTimestamp: new Date().toISOString(),
  };

  return NextResponse.json(versionData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Surrogate-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
