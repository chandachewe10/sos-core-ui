/**
 * Platform-aware export for MapLeaflet
 * This file is used by TypeScript/bundlers
 * At runtime, React Native will automatically use:
 * - MapLeaflet.native.tsx on iOS/Android
 * - MapLeaflet.web.tsx on web
 */

// Export from web implementation by default for type checking
export { default } from './MapLeaflet.web';
