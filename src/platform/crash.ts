import { scrubEvent, type CrashEvent } from './scrub';

/** Public identifier of the Sentry project (EU region). Not a secret. */
const SENTRY_DSN =
  'https://308e40961887df2cfdc845430445398d@o4512250670219264.ingest.de.sentry.io/4512417772994640';

let started = false;
let capture: ((err: unknown) => void) | undefined;

/**
 * Starts crash reporting. Call only after crashReportsAllowed() is true (PRIV-1).
 * Sentry's code is a separate chunk that is downloaded here, not before.
 * Production builds only, so development errors never reach the project.
 */
export async function startCrashReporting(release: string, platform: 'web' | 'android'): Promise<boolean> {
  if (started || !import.meta.env.PROD) return started;
  const Sentry = await import('./sentry-lite');
  Sentry.init({
    dsn: SENTRY_DSN,
    release,
    environment: 'production',
    // Sentry 11 collects user info, cookies, headers and URLs by default. Turn every category off.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    // Only what is needed to catch errors. No breadcrumbs, console capture, page URL, sessions or replay.
    defaultIntegrations: false,
    integrations: [
      Sentry.globalHandlersIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.dedupeIntegration(),
    ],
    initialScope: { tags: { platform } },
    maxBreadcrumbs: 0,
    beforeSend: (event) => scrubEvent(event as unknown as CrashEvent) as unknown as typeof event,
    beforeBreadcrumb: () => null,
  });
  capture = (err) => Sentry.captureException(err);
  started = true;
  return true;
}

/** Sends an error the game caught itself (so global handlers never see it). Does nothing unless started. */
export function reportError(err: unknown): void {
  capture?.(err);
}
