'use client';

import { useEffect } from 'react';

export function PinchZoomPrevention() {
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart);
    document.addEventListener('gesturechange', handleGestureStart);
    document.addEventListener('gestureend', handleGestureStart);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('gesturechange', handleGestureStart);
      document.removeEventListener('gestureend', handleGestureStart);
    };
  }, []);

  return null;
}
