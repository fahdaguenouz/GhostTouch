import React from 'react';
import type { TouchEventPayload } from '@ghosttouch/protocol';

export const translateCoordinates = (
  event: React.MouseEvent<HTMLVideoElement>,
  phoneNativeWidth: number,
  phoneNativeHeight: number
): TouchEventPayload | null => {
  const video = event.currentTarget;
  const rect = video.getBoundingClientRect();

  // Get mouse coordinates relative to the video container
  const relativeX = event.clientX - rect.left;
  const relativeY = event.clientY - rect.top;

  // Verify click is within the active video boundary
  if (relativeX < 0 || relativeX > rect.width || relativeY < 0 || relativeY > rect.height) {
    return null;
  }

  // Translate to phone's physical pixel space
  const phoneX = Math.round((relativeX / rect.width) * phoneNativeWidth);
  const phoneY = Math.round((relativeY / rect.height) * phoneNativeHeight);

  return {
    type: 'TOUCH',
    action: event.type === 'mousedown' ? 'DOWN' : event.type === 'mousemove' ? 'MOVE' : 'UP',
    x: phoneX,
    y: phoneY,
  };
};
