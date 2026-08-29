import React, { useRef, useState, useEffect } from 'react';
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
  nativeWidth = 1080,
  nativeHeight = 2340
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMouseEvent = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (e.type === 'mousemove' && !isDragging) return;
    
    if (e.type === 'mousedown') setIsDragging(true);
    if (e.type === 'mouseup' || e.type === 'mouseleave') setIsDragging(false);

    // Don't process map on leave, just stop dragging
    if (e.type === 'mouseleave') return;

    const payload = translateCoordinates(e, nativeWidth, nativeHeight);
    if (payload) {
      onCoordinatesMap(payload);
    }
  };

  return (
    <div className="phone-viewport-container glass-panel">
      <div className="viewport-header">
        <div className="status-dot live"></div>
        <span>Live Stream</span>
      </div>
      <div className="video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="phone-video"
          onMouseDown={handleMouseEvent}
          onMouseMove={handleMouseEvent}
          onMouseUp={handleMouseEvent}
          onMouseLeave={handleMouseEvent}
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
