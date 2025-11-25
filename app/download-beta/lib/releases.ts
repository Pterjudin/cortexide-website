const FALLBACK_LINUX_APPIMAGE_URL =
    'https://github.com/OpenCortexIDE/cortexide-binaries/releases/download/1.99.30001/CortexIDE-1.99.30001.glibc2.29-x86_64.AppImage';

export type LinuxOption = {
    id: string;
    label: string;
    url: string;
    sourceVersion?: string;
};

export type DownloadLinks = {
    windows: { x64: string | undefined; arm: string | undefined };
    mac: { intel: string | undefined; appleSilicon: string | undefined };
    linux: LinuxOption[];
};

const REQUIRED_ASSETS = [
    (v: string) => `CortexIDESetup-x64-${v}.exe`,
    (v: string) => `CortexIDESetup-arm64-${v}.exe`,
    (v: string) => `CortexIDE.x64.${v}.dmg`,
    (v: string) => `CortexIDE.arm64.${v}.dmg`,
    (v: string) => `VoidSetup-x64-${v}.exe`,
    (v: string) => `VoidSetup-arm64-${v}.exe`,
    (v: string) => `Void.x64.${v}.dmg`,
    (v: string) => `Void.arm64.${v}.dmg`,
];

let cachedVersion: string | null = null;
let cachedLinks: DownloadLinks | null = null;
let lastChecked = 0;
const TTL = process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000; // 1 min in dev, 15 min in prod

const FALLBACK_LINUX_OPTION: LinuxOption = {
    id: 'linux-appimage-fallback',
    label: 'Linux AppImage (Legacy 1.99.30001)',
    url: FALLBACK_LINUX_APPIMAGE_URL,
    sourceVersion: '1.99.30001',
};

const LEGACY_LINUX_RELEASE = '1.99.30.0.2';

const formatArchLabel = (arch: string) => {
    const map: Record<string, string> = {
        x64: 'x64',
        x86_64: 'x86_64',
        amd64: 'AMD64',
        arm64: 'ARM64',
        aarch64: 'ARM64',
        armhf: 'ARMHF',
        loong64: 'Loong64',
        ppc64le: 'PPC64LE',
        riscv64: 'RISC-V64',
    };
    return map[arch.toLowerCase()] ?? arch;
};

type ReleaseAsset = { name: string; browser_download_url: string | undefined };

const buildLegacyLinuxOptions = (): LinuxOption[] => {
    const base = (file: string) =>
        `https://github.com/OpenCortexIDE/cortexide-binaries/releases/download/${LEGACY_LINUX_RELEASE}/${file}`;
    const entries: LinuxOption[] = [
        { id: 'tar-x64', label: 'Linux .tar.gz (x64)', url: base(`CortexIDE-linux-x64-${LEGACY_LINUX_RELEASE}.tar.gz`) },
        { id: 'tar-arm64', label: 'Linux .tar.gz (ARM64)', url: base(`CortexIDE-linux-arm64-${LEGACY_LINUX_RELEASE}.tar.gz`) },
        { id: 'tar-armhf', label: 'Linux .tar.gz (ARMHF)', url: base(`CortexIDE-linux-armhf-${LEGACY_LINUX_RELEASE}.tar.gz`) },
        { id: 'tar-loong64', label: 'Linux .tar.gz (Loong64)', url: base(`CortexIDE-linux-loong64-${LEGACY_LINUX_RELEASE}.tar.gz`) },
        { id: 'tar-ppc64le', label: 'Linux .tar.gz (PPC64LE)', url: base(`CortexIDE-linux-ppc64le-${LEGACY_LINUX_RELEASE}.tar.gz`) },
        { id: 'tar-riscv64', label: 'Linux .tar.gz (RISC-V64)', url: base(`CortexIDE-linux-riscv64-${LEGACY_LINUX_RELEASE}.tar.gz`) },
        { id: 'deb-amd64', label: 'Linux .deb (AMD64)', url: base(`cortexide_${LEGACY_LINUX_RELEASE}_amd64.deb`) },
        { id: 'deb-arm64', label: 'Linux .deb (ARM64)', url: base(`cortexide_${LEGACY_LINUX_RELEASE}_arm64.deb`) },
    ];
    return [
        ...entries.map((option) => ({ ...option, sourceVersion: LEGACY_LINUX_RELEASE })),
        FALLBACK_LINUX_OPTION,
    ];
};

const LEGACY_LINUX_OPTIONS = buildLegacyLinuxOptions();

const buildLinuxOptionsFromAssets = (assets: ReleaseAsset[]): LinuxOption[] => {
    const options: LinuxOption[] = [];
    const addOption = (id: string, label: string, url?: string) => {
        if (!url || options.some((opt) => opt.id === id)) {
            return;
        }
        options.push({ id, label, url });
    };

    for (const asset of assets) {
        const { name, browser_download_url } = asset;
        if (!name || !browser_download_url) {
            continue;
        }
        if (/\.(sha1|sha256)$/i.test(name) || /\.zsync(\.sha1|\.sha256)?$/i.test(name)) {
            continue;
        }

        const tarMatch = /^CortexIDE-linux-([a-z0-9]+)-.*\.tar\.gz$/i.exec(name);
        if (tarMatch) {
            const arch = tarMatch[1].toLowerCase();
            addOption(`tar-${arch}`, `Linux .tar.gz (${formatArchLabel(arch)})`, browser_download_url);
            continue;
        }

        const debMatch = /^cortexide_.*_(amd64|arm64|armhf)\.deb$/i.exec(name);
        if (debMatch) {
            const arch = debMatch[1].toLowerCase();
            addOption(`deb-${arch}`, `Linux .deb (${formatArchLabel(arch)})`, browser_download_url);
            continue;
        }

        const appImageMatch = /^CortexIDE-.*\.AppImage$/i.exec(name);
        if (appImageMatch) {
            const archMatch = /(x86_64|amd64|arm64|aarch64|armhf|ppc64le|loong64|riscv64)/i.exec(name);
            const arch = archMatch ? archMatch[1].toLowerCase() : 'x86_64';
            addOption(`appimage-${arch}`, `Linux AppImage (${formatArchLabel(arch)})`, browser_download_url);
        }
    }

    return options;
};

const createDefaultLinks = (version: string): DownloadLinks => {
    const normalized = version.startsWith('v') ? version.slice(1) : version;
    return {
        windows: {
            x64: `https://github.com/OpenCortexIDE/cortexide-binaries/releases/download/${version}/CortexIDESetup-x64-${normalized}.exe`,
            arm: `https://github.com/OpenCortexIDE/cortexide-binaries/releases/download/${version}/CortexIDESetup-arm64-${normalized}.exe`,
        },
        mac: {
            intel: `https://github.com/OpenCortexIDE/cortexide-binaries/releases/download/${version}/CortexIDE.x64.${normalized}.dmg`,
            appleSilicon: `https://github.com/OpenCortexIDE/cortexide-binaries/releases/download/${version}/CortexIDE.arm64.${normalized}.dmg`,
        },
        linux: LEGACY_LINUX_OPTIONS,
    };
};

export async function getLatestRelease(forceRefresh = false): Promise<{ version: string; links: DownloadLinks }> {
    const now = Date.now();
    // Allow bypassing cache via forceRefresh or environment variable
    const shouldBypassCache = forceRefresh || process.env.FORCE_REFRESH_DOWNLOADS === 'true';
    if (!shouldBypassCache && cachedVersion && now - lastChecked < TTL) {
        return { version: cachedVersion, links: cachedLinks ?? createDefaultLinks(cachedVersion) };
    }

    try {
        const headers: Record<string, string> = {};
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }
        // Use cache: 'no-store' if forcing refresh, otherwise use revalidation
        const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
            headers,
        };
        if (shouldBypassCache) {
            fetchOptions.cache = 'no-store';
        } else {
            fetchOptions.next = { revalidate: TTL / 1000 };
        }
        const response = await fetch('https://api.github.com/repos/OpenCortexIDE/cortexide-binaries/releases/latest', fetchOptions);

        if (response.ok) {
            const data = await response.json();
            const version = data.tag_name as string;
            const normalized = version.startsWith('v') ? version.slice(1) : version;
            const assets: ReleaseAsset[] = data.assets;
            const linuxOptions = buildLinuxOptionsFromAssets(assets);
            if (!linuxOptions.length) {
                linuxOptions.push(...LEGACY_LINUX_OPTIONS);
            } else {
                linuxOptions.forEach((option) => {
                    option.sourceVersion = version;
                });
            }

            // Improved pick function that prefers exact matches and logs for debugging
            const pick = (regex: RegExp, exactName?: string): string | undefined => {
                // First try exact name match if provided
                if (exactName) {
                    const exact = assets.find(a => a.name === exactName);
                    if (exact?.browser_download_url) {
                        return exact.browser_download_url;
                    }
                }
                // Then try regex match
                const found = assets.find(a => regex.test(a.name));
                if (found && process.env.NODE_ENV === 'development') {
                    console.log(`[Download] Matched asset: ${found.name} with pattern: ${regex}`);
                }
                return found?.browser_download_url;
            };

            // Try to find assets using regex patterns that support BUILD_ID suffix
            // BUILD_ID format: -{commitHash}-{timestamp} (e.g., -668f686-20251125-212944)
            // The regex patterns with .* will match files with or without BUILD_ID
            // Only return links for assets that actually exist (no fallback URLs to non-existent files)
            const links: DownloadLinks = {
                windows: {
                    // Match: CortexIDESetup-x64-1.106.00002.exe or CortexIDESetup-x64-1.106.00002-668f686-20251125-212944.exe
                    x64: pick(/^VoidSetup-x64-.*\.exe$/i)
                        ?? pick(/^CortexIDESetup-x64-.*\.exe$/i)
                        ?? undefined,
                    // Match: CortexIDESetup-arm64-1.106.00002.exe or CortexIDESetup-arm64-1.106.00002-668f686-20251125-212944.exe
                    arm: pick(/^VoidSetup-arm64-.*\.exe$/i)
                        ?? pick(/^CortexIDESetup-arm64-.*\.exe$/i)
                        ?? undefined,
                },
                mac: {
                    // Match: CortexIDE.x64.1.106.00002.dmg or CortexIDE.x64.1.106.00002-668f686-20251125-212944.dmg
                    intel: pick(/^Void\.x64\..*\.dmg$/i)
                        ?? pick(/^CortexIDE\.x64\..*\.dmg$/i)
                        ?? pick(/darwin-x64.*\.dmg$/i)
                        ?? undefined,
                    // Match: CortexIDE.arm64.1.106.00002.dmg or CortexIDE.arm64.1.106.00002-668f686-20251125-212944.dmg
                    appleSilicon: pick(/^Void\.arm64\..*\.dmg$/i)
                        ?? pick(/^CortexIDE\.arm64\..*\.dmg$/i)
                        ?? pick(/darwin-arm64.*\.dmg$/i)
                        ?? undefined,
                },
                linux: linuxOptions,
            };

            // Log selected links in development for debugging
            if (process.env.NODE_ENV === 'development') {
                console.log('[Download] Selected links:', {
                    macIntel: links.mac.intel,
                    macArm: links.mac.appleSilicon,
                    winX64: links.windows.x64,
                    winArm: links.windows.arm,
                });
            }

            cachedVersion = version;
            cachedLinks = links;
            lastChecked = now;
            return { version, links };
        }
    } catch (e) {
        console.error('Failed to fetch latest release:', e);
    }

    const candidateVersionFiles = [
        'https://raw.githubusercontent.com/OpenCortexIDE/cortexide-versions/main/latest.txt',
        'https://raw.githubusercontent.com/OpenCortexIDE/cortexide-versions/main/version.txt',
        'https://raw.githubusercontent.com/OpenCortexIDE/cortexide-versions/main/stable.txt',
    ];
    let version = cachedVersion ?? '1.99.30023';
    for (const url of candidateVersionFiles) {
        try {
            const res = await fetch(url, { next: { revalidate: TTL / 1000 } });
            if (res.ok) {
                const text = (await res.text()).trim();
                if (text) {
                    version = text;
                    break;
                }
            }
        } catch {}
    }
    cachedVersion = version;
    const links = createDefaultLinks(version);
    cachedLinks = links;
    lastChecked = now;
    return { version, links };
}

export { FALLBACK_LINUX_APPIMAGE_URL, FALLBACK_LINUX_OPTION };

