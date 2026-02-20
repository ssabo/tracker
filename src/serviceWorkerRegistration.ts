// Registers a service worker for offline support (production builds only).
//
// After first load all static assets are cached, so subsequent visits and
// navigations work without a network connection.  Updates are picked up in the
// background; the new version takes effect once all tabs are closed.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[01]?\d|\d{1,2})){3}$/)
);

export type RegistrationConfig = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: RegistrationConfig): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  // Bail out if PUBLIC_URL is on a different origin (e.g. CDN).
  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      // On localhost, verify the SW still exists before registering.
      checkValidServiceWorker(swUrl, config);
      navigator.serviceWorker.ready.then(() => {
        console.log('[SW] Serving cached content in offline mode.');
      });
    } else {
      registerValidSW(swUrl, config);
    }
  });
}

function registerValidSW(swUrl: string, config?: RegistrationConfig): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.onstatechange = () => {
          if (installing.state !== 'installed') return;

          if (navigator.serviceWorker.controller) {
            // A new version is staged; it will activate after all tabs close.
            console.log('[SW] New version available. Close all tabs to update.');
            config?.onUpdate?.(registration);
          } else {
            // First install — everything is now cached for offline use.
            console.log('[SW] Content cached for offline use.');
            config?.onSuccess?.(registration);
          }
        };
      };
    })
    .catch((err) => {
      console.error('[SW] Registration failed:', err);
    });
}

function checkValidServiceWorker(swUrl: string, config?: RegistrationConfig): void {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      const notFound =
        response.status === 404 ||
        (contentType != null && !contentType.includes('javascript'));

      if (notFound) {
        // SW file is gone — unregister and hard reload.
        navigator.serviceWorker.ready.then((reg) => {
          reg.unregister().then(() => window.location.reload());
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No network — running from cache.');
    });
}

export function unregister(): void {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => reg.unregister())
    .catch((err) => console.error(err.message));
}
