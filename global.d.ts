export {}; // This line ensures the file is treated as a module.

declare global {
  interface Window {
    /**
     * The Google Tag Manager data layer.
     */
    dataLayer: any[];
  }
}