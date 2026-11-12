/**
 * Allow-list scrubbing for crash reports (PRIV-5). Only the fields named here leave the device.
 * Kept free of Sentry imports so it can be unit-tested and so loading it downloads nothing.
 */

interface Frame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
  in_app?: boolean;
}

export interface CrashEvent {
  event_id?: string;
  timestamp?: number;
  level?: string;
  platform?: string;
  release?: string;
  environment?: string;
  exception?: {
    values?: {
      type?: string;
      value?: string;
      stacktrace?: { frames?: Frame[] };
      mechanism?: { type?: string; handled?: boolean };
    }[];
  };
  contexts?: Record<string, Record<string, unknown> | undefined>;
  tags?: Record<string, unknown>;
  [other: string]: unknown;
}

const MAX_MESSAGE = 300;

/** Removes things that could identify a player from free text: emails, long tokens (save codes), URLs' queries. */
export function scrubText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/([?#])[^\s"')]+/g, '$1[removed]')
    .replace(/[A-Za-z0-9_-]{24,}={0,2}/g, '[token]')
    .slice(0, MAX_MESSAGE);
}

/** File name without the origin or query, so paths on the player's device or their URL never appear. */
function scrubFilename(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const noQuery = name.split(/[?#]/)[0]!;
  const i = noQuery.lastIndexOf('/assets/');
  return i >= 0 ? noQuery.slice(i) : noQuery.slice(noQuery.lastIndexOf('/') + 1);
}

function pick(src: Record<string, unknown> | undefined, keys: string[]): Record<string, unknown> | undefined {
  if (!src) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const v = src[k];
    if (typeof v === 'string' || typeof v === 'number') out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Returns a new event holding only allow-listed fields. No user, request, breadcrumbs or extras. */
export function scrubEvent(event: CrashEvent): CrashEvent {
  const out: CrashEvent = {};
  if (event.event_id) out.event_id = event.event_id;
  if (event.timestamp) out.timestamp = event.timestamp;
  if (event.level) out.level = event.level;
  if (event.platform) out.platform = event.platform;
  if (event.release) out.release = event.release;
  if (event.environment) out.environment = event.environment;

  const values = event.exception?.values;
  if (values) {
    out.exception = {
      values: values.map((v) => ({
        ...(v.type ? { type: v.type } : {}),
        ...(v.value ? { value: scrubText(v.value) } : {}),
        ...(v.mechanism
          ? { mechanism: { type: v.mechanism.type ?? 'generic', handled: v.mechanism.handled ?? false } }
          : {}),
        ...(v.stacktrace?.frames
          ? {
              stacktrace: {
                frames: v.stacktrace.frames.map((f) => {
                  const frame: Frame = {};
                  const filename = scrubFilename(f.filename);
                  if (filename) frame.filename = filename;
                  if (f.function) frame.function = f.function;
                  if (f.lineno !== undefined) frame.lineno = f.lineno;
                  if (f.colno !== undefined) frame.colno = f.colno;
                  if (f.in_app !== undefined) frame.in_app = f.in_app;
                  return frame;
                }),
              },
            }
          : {}),
      })),
    };
  }

  const contexts: Record<string, Record<string, unknown>> = {};
  const os = pick(event.contexts?.os, ['name', 'version']);
  const browser = pick(event.contexts?.browser, ['name', 'version']);
  const device = pick(event.contexts?.device, ['family', 'model']);
  if (os) contexts.os = os;
  if (browser) contexts.browser = browser;
  if (device) contexts.device = device;
  if (Object.keys(contexts).length) out.contexts = contexts;

  const tags = pick(event.tags, ['platform']);
  if (tags) out.tags = tags;
  return out;
}
