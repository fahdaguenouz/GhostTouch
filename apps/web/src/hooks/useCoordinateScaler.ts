import type React from 'react';
import type { TouchEventPayload } from '@ghosttouch/protocol';

export const translateCoordinates = (
  event: React.PointerEvent<HTMLVideoElement>,
  phoneNativeWidth: number,
  phoneNativeHeight: number
): TouchEventPayload | null => {
  const video = event.currentTarget;
  const rect = video.getBoundingClientRect();

  // Get mouse coordinates relative to the video container
  const relativeX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const relativeY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);

  // Verify click is within the active video boundary
  if (!rect.width || !rect.height || phoneNativeWidth <= 0 || phoneNativeHeight <= 0) {
    return null;
  }

  // Translate to phone's physical pixel space
  const phoneX = Math.round((relativeX / rect.width) * phoneNativeWidth);
  const phoneY = Math.round((relativeY / rect.height) * phoneNativeHeight);

  return {
    type: 'TOUCH',
    action: event.type === 'pointerdown' ? 'DOWN' : event.type === 'pointermove' ? 'MOVE' : 'UP',
    x: phoneX,
    y: phoneY,
  };
};
