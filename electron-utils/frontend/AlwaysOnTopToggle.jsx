import { useState, useEffect } from 'react';

// One ready-made UI for the always-on-top feature.
// This component is optional: apps can also call window.windowControl.setAlwaysOnTop()
// directly from their own buttons, menus, or keyboard shortcuts.
export default function AlwaysOnTopToggle() {
  const [isOnTop, setIsOnTop] = useState(false);

  useEffect(() => {
    if (!window.windowControl) return;
    window.windowControl.isAlwaysOnTop().then(setIsOnTop);
  }, []);

  // preload did not expose window control (e.g. running in a plain browser)
  if (!window.windowControl) {
    return null;
  }

  const handleToggle = async () => {
    const newState = await window.windowControl.setAlwaysOnTop(!isOnTop);
    setIsOnTop(newState);
  };

  return (
    <button onClick={handleToggle}>
      always on top: {isOnTop ? 'on' : 'off'}
    </button>
  );
}
