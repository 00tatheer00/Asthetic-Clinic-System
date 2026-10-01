/**
 * Brimish Skin Care Clinic - Browser Cache & Deployment Freshness Utilities
 * 
 * Provides robust utilities to purge browser cache, service workers,
 * CacheStorage, and verify deployment version freshness.
 */

export interface VersionInfo {
  version: string;
  buildTime: string;
  environment: string;
  gitCommit?: string | null;
}

const STORAGE_KEY_VERSION = 'brimish_deployed_version';

/**
 * Completely purges all browser caches, CacheStorage, unregisters/updates
 * service workers, clears session storage, and performs a hard refresh.
 */
export async function clearBrowserCacheAndReload(options: {
  showNotification?: boolean;
  hardRedirect?: boolean;
} = {}): Promise<void> {
  const { hardRedirect = true } = options;

  console.log('[CacheManager] Initiating full browser cache purge...');

  try {
    // 1. Purge all CacheStorage entries (Service Worker & Cache API)
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          console.log(`[CacheManager] Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }

    // 2. Notify and update all Service Workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Send clear command to active worker
        if (registration.active) {
          registration.active.postMessage({ type: 'CLEAR_CACHE' });
          registration.active.postMessage({ type: 'SKIP_WAITING' });
        }
        // Force update to fetch latest sw.js from server
        try {
          await registration.update();
        } catch {
          // Ignore network errors during update
        }
      }
    }

    // 3. Clear sessionStorage and non-critical local storage caches
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      // Remove any version stamp so fresh version is recorded on next load
      localStorage.removeItem(STORAGE_KEY_VERSION);
      
      // Clean up any temporary or cached keys while preserving auth tokens
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('brimish_cache_') || key.startsWith('sw_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (err) {
    console.error('[CacheManager] Error while purging cache:', err);
  }

  // 4. Force hard reload with timestamp cache-buster query parameter
  if (hardRedirect && typeof window !== 'undefined') {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_v', Date.now().toString());
    window.location.href = currentUrl.toString();
  }
}

/**
 * Fetches the current live deployment version from /api/version
 */
export async function fetchLiveDeploymentVersion(): Promise<VersionInfo | null> {
  try {
    const response = await fetch(`/api/version?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[CacheManager] Failed to fetch deployment version:', err);
    return null;
  }
}

/**
 * Checks if a newer deployment is available compared to the currently running client.
 */
export async function checkForDeploymentUpdate(): Promise<{
  hasUpdate: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  buildTime: string | null;
}> {
  if (typeof window === 'undefined') {
    return { hasUpdate: false, currentVersion: null, latestVersion: null, buildTime: null };
  }

  const live = await fetchLiveDeploymentVersion();
  if (!live || !live.version) {
    return { hasUpdate: false, currentVersion: null, latestVersion: null, buildTime: null };
  }

  const storedVersion = localStorage.getItem(STORAGE_KEY_VERSION);

  // If first time visiting, store current version
  if (!storedVersion) {
    localStorage.setItem(STORAGE_KEY_VERSION, live.version);
    return {
      hasUpdate: false,
      currentVersion: live.version,
      latestVersion: live.version,
      buildTime: live.buildTime,
    };
  }

  // If stored version differs from live server version, an update is available!
  if (storedVersion !== live.version) {
    return {
      hasUpdate: true,
      currentVersion: storedVersion,
      latestVersion: live.version,
      buildTime: live.buildTime,
    };
  }

  return {
    hasUpdate: false,
    currentVersion: storedVersion,
    latestVersion: live.version,
    buildTime: live.buildTime,
  };
}

/**
 * Updates the stored version to the latest version.
 */
export function markVersionAsCurrent(version: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VERSION, version);
  }
}
