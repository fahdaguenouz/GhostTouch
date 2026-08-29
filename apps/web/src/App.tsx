import { useState } from 'react';
import { ConnectionManager, type ConnectionState } from './components/connection/ConnectionManager';
import { PhoneViewport } from './components/stream/PhoneViewport';
import { SystemControlBar } from './components/stream/SystemControlBar';
import { TelemetryCard } from './components/telemetry/TelemetryCard';
import { LocationMap } from './components/telemetry/LocationMap';
import type { TouchEventPayload } from '@ghosttouch/protocol';

function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [telemetry, setTelemetry] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Mock WebRTC Connection for testing
  const handleConnect = (_pin: string) => {
    setConnectionState('CONNECTING');
    
    // Simulate connection delay
    setTimeout(() => {
      setConnectionState('LIVE');
      
      // Mock stream (using a generic video or canvas would be better, but we leave it empty for now or use a blank stream)
      // For testing, we won't have a real stream unless we capture the user's screen or use a sample video.
      
      // Mock Telemetry Update
      setTelemetry({
        batteryLevel: 85,
        isCharging: true,
        networkType: 'WIFI',
        nativeWidth: 1080,
        nativeHeight: 2340
      });

      // Mock Location Update (Rabat, Morocco)
      setLocation({
        latitude: 34.020882,
        longitude: -6.841650,
        accuracy: 15,
        timestamp: Date.now()
      });
      
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnectionState('DISCONNECTED');
    setTelemetry(null);
    setLocation(null);
    setStream(null);
  };

  const handleCoordinatesMap = (payload: TouchEventPayload) => {
    console.log('[DataChannel TX] TOUCH_EVENT', payload);
  };

  const handleSystemAction = (action: 'BACK' | 'HOME' | 'RECENTS') => {
    console.log('[DataChannel TX] SYSTEM_ACTION', action);
  };

  return (
    <div className="dashboard-container">
      {/* Left Column: Video Stream */}
      <div className="main-content">
        <PhoneViewport 
          stream={stream} 
          onCoordinatesMap={handleCoordinatesMap}
          nativeWidth={telemetry?.nativeWidth}
          nativeHeight={telemetry?.nativeHeight}
        />
        <SystemControlBar onAction={handleSystemAction} />
      </div>

      {/* Right Column: Telemetry & Connection */}
      <div className="sidebar">
        <ConnectionManager 
          connectionState={connectionState}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
        
        <TelemetryCard data={telemetry} />
        
        <LocationMap location={location} />
      </div>
    </div>
  );
}

export default App;
