'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { clearBrowserCacheAndReload, checkForDeploymentUpdate } from '@/lib/cache-utils';

export function PwaRegister() {
  const isUpdatingRef = useRef(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check deployment updates periodically
    const performUpdateCheck = async (swRegistration?: ServiceWorkerRegistration) => {
      // 1. Check Service Worker updates from server
      if (swRegistration) {
        try {
          await swRegistration.update();
        } catch {
          // Ignore network errors during check
        }
      }

      // 2. Check /api/version for deployment updates
      try {
        const updateInfo = await checkForDeploymentUpdate();
        if (updateInfo.hasUpdate && !toastShownRef.current) {
          toastShownRef.current = true;
          toast.info('New Version Available', {
            description: 'A new update is available. Refresh to load the latest changes.',
            action: {
              label: 'Update Now',
              onClick: () => {
                isUpdatingRef.current = true;
                clearBrowserCacheAndReload();
              },
            },
            duration: 15000,
            onDismiss: () => {
              toastShownRef.current = false;
            },
          });
        }
      } catch (err) {
        console.warn('[CacheManager] Error checking deployment updates:', err);
      }
    };

    let swRegistration: ServiceWorkerRegistration | undefined;

    // Register Service Worker in production (and check for updates)
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const handleLoad = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            swRegistration = reg;
            console.log('[PWA] Service Worker active with scope:', reg.scope);

            // Listen for service worker updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (!newWorker) return;

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new service worker has been installed and is waiting
                  newWorker.postMessage({ type: 'SKIP_WAITING' });

                  if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    toast.info('System Update Available', {
                      description: 'A fresh deployment of Brimish Clinic is ready.',
                      action: {
                        label: 'Update Now',
                        onClick: () => {
                          isUpdatingRef.current = true;
                          clearBrowserCacheAndReload();
                        },
                      },
                      duration: 15000,
                      onDismiss: () => {
                        toastShownRef.current = false;
                      },
                    });
                  }
                }
              });
            });

            // Initial update check after registration
            performUpdateCheck(reg);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
      }

      // Listen for controller changes (when new SW activates)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!isUpdatingRef.current) {
          console.log('[PWA] Controller changed to new Service Worker version.');
        }
      });
    } else {
      // In development or if SW not supported, still check deployment API
      performUpdateCheck();
    }

    // Check when user refocuses tab or page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performUpdateCheck(swRegistration);
      }
    };

    const handleFocus = () => {
      performUpdateCheck(swRegistration);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check every 3 minutes
    const intervalId = setInterval(() => {
      performUpdateCheck(swRegistration);
    }, 180000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}
