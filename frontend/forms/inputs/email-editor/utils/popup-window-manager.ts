// Check if we're in a browser environment
const browser = typeof window !== 'undefined';

// Local storage key for window settings
const WINDOW_SETTINGS_KEY = 'emailEditorPreviewWindowSettings';

// Window settings interface
interface WindowSettings {
  width: number;
  height: number;
  left: number;
  top: number;
}

/**
 * Saves window position and size to local storage
 * @param win - The window object to save settings for
 */
export function saveWindowSettings(win: Window): void {
  console.log('tying Saving window settings:', win);
  if (!browser) return;

  console.log('Saving window settings:', win);

  const settings: WindowSettings = {
    width: win.outerWidth,
    height: win.outerHeight,
    left: win.screenX,
    top: win.screenY
  };

  localStorage.setItem(WINDOW_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Retrieves saved window settings from local storage
 * @returns The saved window settings or null if none exist
 */
export function getWindowSettings(): WindowSettings | null {
  if (!browser) return null;

  const settingsStr = localStorage.getItem(WINDOW_SETTINGS_KEY);
  if (!settingsStr) return null;

  try {
    return JSON.parse(settingsStr) as WindowSettings;
  } catch (e) {
    console.error('Failed to parse window settings:', e);
    return null;
  }
}

// Store the last known window dimensions and position
let lastWindowState = {
  width: 0,
  height: 0,
  left: 0,
  top: 0
};

/**
 * Sets up polling to track window position and size changes
 * @param win - The window object to track
 */
export function setupWindowPolling(win: Window): void {
  console.log('Setting up window polling');
  
  // Initialize the last known state
  lastWindowState = {
    width: win.outerWidth,
    height: win.outerHeight,
    left: win.screenX,
    top: win.screenY
  };
  
  // Set up polling interval (every 2 seconds)
  const pollingInterval = setInterval(() => {
    // Check if window still exists and is not closed
    if (win.closed) {
      console.log('Window closed, clearing polling interval');
      clearInterval(pollingInterval);
      return;
    }
    
    try {
      // Check if window dimensions or position have changed
      const currentState = {
        width: win.outerWidth,
        height: win.outerHeight,
        left: win.screenX,
        top: win.screenY
      };
      
      // Compare with last known state
      if (hasStateChanged(lastWindowState, currentState)) {
        console.log('Window state changed:', currentState);
        saveWindowSettings(win);
        console.log('Window settings saved');
        
        // Update last known state
        lastWindowState = { ...currentState };
      }
    } catch (error) {
      // Handle errors (e.g., if window becomes inaccessible)
      console.error('Error polling window state:', error);
      clearInterval(pollingInterval);
    }
  }, 2000); // Poll every 2 seconds
  
  // Store the interval ID on the window object so it can be cleared if needed
  (win as any).__pollingIntervalId = pollingInterval;
}

/**
 * Check if window state has changed
 * @param oldState - Previous window state
 * @param newState - Current window state
 * @returns True if state has changed, false otherwise
 */
function hasStateChanged(
  oldState: { width: number; height: number; left: number; top: number },
  newState: { width: number; height: number; left: number; top: number }
): boolean {
  return (
    oldState.width !== newState.width ||
    oldState.height !== newState.height ||
    oldState.left !== newState.left ||
    oldState.top !== newState.top
  );
}

/**
 * Opens a popup window with saved dimensions and position
 * @param url - URL to open in the popup
 * @param name - Name for the popup window
 * @param defaultFeatures - Default window features if no saved settings exist
 * @returns The opened window object or null if opening failed
 */
export function openPopupWithSavedSettings(
  url: string,
  name: string,
  defaultFeatures: string = 'width=400,height=720'
): Window | null {
  console.log('tying opening popup with saved settings');
  if (typeof window === 'undefined') return null;
  console.log('window is defined');
  // Get saved window settings or use defaults
  const settings = getWindowSettings();
  let windowFeatures = '';

  if (settings) {
    windowFeatures = `width=${settings.width},height=${settings.height},left=${settings.left},top=${settings.top}`;
  } else {
    windowFeatures = defaultFeatures;
  }

  const popup = window.open(url, name, windowFeatures);

  console.log('popup', popup);

  if (popup) {
    console.log('popup is defined');
    // Set up polling to track window position and size
    setupWindowPolling(popup);
  }

  return popup;
}
