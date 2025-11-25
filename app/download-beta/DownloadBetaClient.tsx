'use client'

import React from 'react';
import { binariesLink, discordLink, githubLink, releaseLink } from '@/components/links';
import { FaApple, FaWindows, FaLinux } from 'react-icons/fa';
import './twinkle.css'
import Image from 'next/image';
import SparkleOverlay from './SparkleOverlay';
import posthog from 'posthog-js';

// Floating Element
const FloatingElement = () => (
    <div className='relative flex flex-col items-center'>
        <div className='animate-float'>
            <Image
                width={138}
                height={138}
                draggable={false}
                src='/cortexide-main.png'
                alt='CortexIDE Logo'
                className='rounded-full'
            />
        </div>
        <svg
            className='absolute -bottom-6 opacity-20 animate-shadow'
            width='75'
            height='22.5'
            viewBox='-9 -3 54 15'
        >
            <defs>
                <filter id='blur' x='-50%' y='-50%' width='300%' height='300%'>
                    <feGaussianBlur in='SourceGraphic' stdDeviation='2.25' />
                </filter>
            </defs>
            <ellipse cx='18' cy='4.5' rx='18' ry='4.5' fill='black' filter='url(#blur)' />
        </svg>
    </div>
);

// Download button with tracking
const DownloadButton = ({ url, children, className, platform, arch }: { 
    url: string; 
    children: React.ReactNode; 
    className?: string;
    platform?: string;
    arch?: string;
}) => {
    const handleClick = () => {
        if (typeof window !== 'undefined' && posthog) {
            posthog.capture('DownloadFile', {
                platform: platform || 'unknown',
                architecture: arch || 'unknown',
                url: url,
            });
        }
    };

    return (
        <a
            draggable={false}
            tabIndex={0}
            className={`group gap-2 flex justify-center items-center drop-shadow-xl p-2 py-3 rounded-lg btn px-8 opacity-90 whitespace-nowrap border-0 
            bg-black/95 hover:bg-black/90 hover:brightness-105 active:brightness-105 active:scale-95 duration-200 outline-none cursor-pointer ${className}`}
            href={url}
            onClick={handleClick}
        >
            {children}
        </a>
    );
};

// Actual page content (Client Component with data hydration)
type DownloadLinks = {
    windows: { x64: string; arm: string };
    mac: { intel: string; appleSilicon: string };
    linux: Array<{ id: string; label: string; url: string }>;
};

const FALLBACK_LINUX_APPIMAGE_URL =
    'https://github.com/OpenCortexIDE/cortexide-binaries/releases/download/1.99.30001/CortexIDE-1.99.30001.glibc2.29-x86_64.AppImage';

export default function DownloadBetaClient({ releaseVersion, links }: { releaseVersion: string, links?: DownloadLinks }) {
    // Use provided links or create empty structure (no fallback URLs to non-existent files)
    const downloadLinks: DownloadLinks = links ?? {
        windows: {
            x64: undefined,
            arm: undefined,
        },
        mac: {
            intel: undefined,
            appleSilicon: undefined,
        },
        linux: [
            {
                id: 'linux-appimage-fallback',
                label: 'Linux AppImage (Legacy 1.99.30001)',
                url: FALLBACK_LINUX_APPIMAGE_URL,
            },
        ],
    };

    return (
        <main className='min-h-screen relative max-w-[1400px] mx-auto px-4 lg:px-12'>
            <section className='h-fit py-16 mt-4 sm:mt-32 flex flex-col md:flex-row items-center justify-center gap-x-8 rounded-xl text-black shadow-xl bg-gray-100'>
                {/* left */}
                <div className='text-balance max-sm:text-base text-xl max-w-[600px] space-y-5'>
                    <h2 className='mx-auto text-center text-3xl lg:text-4xl tracking-tight font-black'>
                        <div className='flex justify-center items-center '>Download CortexIDE.</div>
                    </h2>

                    <div className='mx-auto pb-4 text-center px-4 text-balance max-w-[400px]'>
                        Try the beta edition of CortexIDE, or check out the source on {' '}
                        <a href={githubLink} target='_blank' rel='noreferrer noopener nofollow' className='underline'>
                            GitHub
                        </a>
                        .
                    </div>

                    <div className='px-4 max-sm:scale-75 max-[450px]:scale-50 space-y-2'>
                        {downloadLinks.mac.appleSilicon && (
                            <div className='flex items-center gap-x-2'>
                                <DownloadButton 
                                    url={downloadLinks.mac.appleSilicon} 
                                    className='relative w-full'
                                    platform='mac'
                                    arch='arm64'
                                >
                                    <SparkleOverlay number={25} seed={42} />
                                    <span className='flex items-center gap-2'>
                                        <span className='text-white text-xl font-medium'>Download for Mac</span>
                                        <FaApple className='fill-white min-w-7 min-h-7' />
                                    </span>
                                </DownloadButton>
                                {downloadLinks.mac.intel && (
                                    <DownloadButton 
                                        url={downloadLinks.mac.intel} 
                                        className='relative flex-grow-0 flex-shrink-0 w-40'
                                        platform='mac'
                                        arch='x64'
                                    >
                                        <SparkleOverlay number={15} seed={501} />
                                        <span className='flex items-center gap-2'>
                                            <span className='text-white text-xl font-medium'>Intel</span>
                                            <FaApple className='fill-white min-w-7 min-h-7' />
                                        </span>
                                    </DownloadButton>
                                )}
                            </div>
                        )}

                        {downloadLinks.windows.x64 && (
                            <div className='flex items-center gap-x-2'>
                                <DownloadButton 
                                    url={downloadLinks.windows.x64} 
                                    className='relative w-full'
                                    platform='windows'
                                    arch='x64'
                                >
                                    <SparkleOverlay number={25} seed={43} />
                                    <span className='flex items-center gap-2'>
                                        <span className='text-white text-xl font-medium'>Download for Windows</span>
                                        <FaWindows className='fill-white min-w-7 min-h-7' />
                                    </span>
                                </DownloadButton>
                                {downloadLinks.windows.arm && (
                                    <DownloadButton 
                                        url={downloadLinks.windows.arm} 
                                        className='relative flex-grow-0 flex-shrink-0 w-40'
                                        platform='windows'
                                        arch='arm64'
                                    >
                                        <SparkleOverlay number={15} seed={100} />
                                        <span className='flex items-center gap-2'>
                                            <span className='text-white text-xl font-medium'>ARM</span>
                                            <FaWindows className='fill-white min-w-7 min-h-7' />
                                        </span>
                                    </DownloadButton>
                                )}
                            </div>
                        )}

                        <div className='flex flex-col gap-3 w-full'>
                            <DownloadButton 
                                url='/download-beta/linux' 
                                className='relative w-full'
                                platform='linux'
                                arch='linux-landing'
                            >
                                <SparkleOverlay number={25} seed={44} />
                                <span className='flex items-center gap-2'>
                                    <span className='text-white text-xl font-medium'>View Linux downloads</span>
                                    <FaLinux className='fill-white min-w-7 min-h-7' />
                                </span>
                            </DownloadButton>
                        </div>

                    </div>

                </div>

                {/* right */}
                <div className='min-w-60 min-h-60 flex justify-center items-center'>
                    <FloatingElement />
                </div>
            </section>

            {/* desc */}
            <div className='mx-auto text-center px-4 text-balance pt-60 pb-40 text-white'>
                <div className='my-1'>
                    Alternatively, download CortexIDE from the source on{' '}
                    <a href={releaseLink} target='_blank' rel='noreferrer noopener nofollow' className='underline text-white'>
                        GitHub
                    </a>
                    .
                </div>
            </div>
        </main>
    );
}

