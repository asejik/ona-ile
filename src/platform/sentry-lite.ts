/** Only the parts of Sentry the game uses, so the opt-in download stays small. */
export { init, globalHandlersIntegration, linkedErrorsIntegration, dedupeIntegration } from '@sentry/browser';
