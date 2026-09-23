import React, { useRef, useEffect } from 'react';
import { translateCoordinates } from '../../hooks/useCoordinateScaler';
import type { TouchEventPayload } from '@ghosttouch/protocol';
import './stream.css';

interface PhoneViewportProps {
  stream: MediaStream | null;
  onCoordinatesMap: (payload: TouchEventPayload) => void;
  nativeWidth?: number;
  nativeHeight?: number;
}

export const PhoneViewport: React.FC<PhoneViewportProps> = ({
  stream,
  onCoordinatesMap,
  nativeWidth,
  nativeHeight
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const handlePointerEvent = (e: React.PointerEvent<HTMLVideoElement>) => {
    if (!stream || e.type === 'pointermove' && !dragging.current) return;
    if (e.type === 'pointerdown') {
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const width = nativeWidth || e.currentTarget.videoWidth;
    const height = nativeHeight || e.currentTarget.videoHeight;
    const payload = translateCoordinates(e, width, height);
    if (payload) {
      onCoordinatesMap(payload);
    }
    if (e.type === 'pointerup' || e.type === 'pointercancel') {
      dragging.current = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="phone-viewport-container glass-panel">
      <div className="viewport-header">
        <div className={`status-dot ${stream ? 'live' : ''}`}></div>
        <span>{stream ? 'Live Stream' : 'Awaiting Stream'}</span>
      </div>
      <div className="video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="phone-video"
          onPointerDown={handlePointerEvent}
          onPointerMove={handlePointerEvent}
          onPointerUp={handlePointerEvent}
          onPointerCancel={handlePointerEvent}
        />
        {!stream && (
          <div className="no-signal">
            <span>NO SIGNAL</span>
          </div>
        )}
      </div>
    </div>
  );
};
