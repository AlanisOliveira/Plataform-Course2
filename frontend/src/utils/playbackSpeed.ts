const PLAYBACK_SPEED_KEY = 'videoPlaybackSpeed';

/**
 * Get the saved playback speed from localStorage
 * @returns The saved playback speed, defaults to 1 if not found
 */
export function getPlaybackSpeed(): number {
  try {
    const saved = localStorage.getItem(PLAYBACK_SPEED_KEY);
    if (saved) {
      const speed = parseFloat(saved);
      // Validate that it's a reasonable speed value
      if (!isNaN(speed) && speed > 0 && speed <= 4) {
        return speed;
      }
    }
  } catch (error) {
    console.error('Error loading playback speed:', error);
  }
  return 1; // Default speed
}

/**
 * Save the playback speed to localStorage
 * @param speed The playback speed to save
 */
export function setPlaybackSpeed(speed: number): void {
  try {
    localStorage.setItem(PLAYBACK_SPEED_KEY, speed.toString());
  } catch (error) {
    console.error('Error saving playback speed:', error);
  }
}
