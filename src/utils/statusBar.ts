/**
 * Status Bar visibility & style helper for PG Ease apps.
 * Works seamlessly with @capacitor/status-bar on native devices
 * and safely no-ops on desktop / web browsers.
 */

export function setAppStatusBar(isTeal: boolean = false) {
  if (typeof window === 'undefined') return;
  const statusBar = (window as any).Capacitor?.Plugins?.StatusBar;
  if (!statusBar) return;

  try {
    // Ensure content NEVER draws under the status bar
    statusBar.setOverlaysWebView({ overlay: false });

    if (isTeal) {
      // Teal screens: Teal background, white icons (Dark style)
      statusBar.setBackgroundColor({ color: '#008080' });
      statusBar.setStyle({ style: 'DARK' });
    } else {
      // Light / White screens: White background, dark icons (Light style)
      statusBar.setBackgroundColor({ color: '#FFFFFF' });
      statusBar.setStyle({ style: 'LIGHT' });
    }
  } catch (err) {
    // Non-fatal if native bridge is warming up
    console.debug('StatusBar sync notice:', err);
  }
}
