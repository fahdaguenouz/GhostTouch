import { ConnectionManager } from './components/connection/ConnectionManager';
import { PhoneViewport } from './components/stream/PhoneViewport';
import { SystemControlBar } from './components/stream/SystemControlBar';
import { TelemetryCard } from './components/telemetry/TelemetryCard';
import { LocationMap } from './components/telemetry/LocationMap';
import type { TouchEventPayload } from '@ghosttouch/protocol';
import { useRemoteSession } from './hooks/useRemoteSession';

function App() {
  const { connectionState, telemetry, location, stream, error, connect, disconnect, send } = useRemoteSession();

  const handleCoordinatesMap = (payload: TouchEventPayload) => {
    send(payload);
  };

  const handleSystemAction = (action: 'BACK' | 'HOME' | 'RECENTS') => {
    send({ type: 'SYSTEM_ACTION', action });
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
          onConnect={connect}
          onDisconnect={disconnect}
          error={error}
        />
        
        <TelemetryCard data={telemetry} />
        
        <LocationMap location={location} />
      </div>
    </div>
  );
}

export default App;
