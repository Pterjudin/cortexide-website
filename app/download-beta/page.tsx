/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { binariesLink, discordLink, githubLink, releaseLink } from '@/components/links';
import DownloadBetaClient from './DownloadBetaClient';
import { getLatestRelease } from './lib/releases';
import { baseUrl } from '../sitemap';

export const metadata = {
  title: 'Download CortexIDE - Free AI-Powered Code Editor',
  description: 'Download CortexIDE, the open source Cursor alternative. Available for Windows, macOS, and Linux. Full privacy, fully-featured AI code editor.',
  alternates: {
    canonical: `${baseUrl}/download-beta`,
  },
  openGraph: {
    siteName: 'CortexIDE',
    title: 'Download CortexIDE - Free AI-Powered Code Editor',
    description: 'Download CortexIDE, the open source Cursor alternative. Available for Windows, macOS, and Linux.',
    type: 'website',
    url: `${baseUrl}/download-beta`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download CortexIDE',
    description: 'Download CortexIDE, the open source Cursor alternative. Available for Windows, macOS, and Linux.',
  },
};

// Disable Next.js caching for this page to always fetch fresh release data
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DownloadBetaPage() {
    const { version, links } = await getLatestRelease(true); // Force refresh

    return <DownloadBetaClient releaseVersion={version} links={links} />;
}
