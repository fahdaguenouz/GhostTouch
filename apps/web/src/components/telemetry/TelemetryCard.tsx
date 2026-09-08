import React from 'react';
import { Battery, BatteryCharging, Wifi, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import type { DeviceTelemetry } from '@ghosttouch/protocol';
import './telemetry.css';

interface TelemetryCardProps {
  data: DeviceTelemetry | null;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="telemetry-card glass-panel loading">
        <span className="pulsing-text">Waiting for telemetry...</span>
      </div>
    );
  }

  return (
    <div className="telemetry-card glass-panel">
      <div className="telemetry-header">
        <h3>System Telemetry</h3>
      </div>
      
      <div className="telemetry-grid">
        <div className="telemetry-item">
          <div className="telemetry-icon"><Smartphone size={20} /></div>
          <div className="telemetry-info"><span className="label">Device</span><span className="value">{data.deviceName || data.model || 'Android phone'}{data.androidVersion ? ` · Android ${data.androidVersion}` : ''}</span></div>
        </div>
        <div className="telemetry-item">
          <div className="telemetry-icon">
            {data.isCharging ? <BatteryCharging size={20} className="charging" /> : <Battery size={20} />}
          </div>
          <div className="telemetry-info">
            <span className="label">Battery</span>
            <span className="value">{data.batteryLevel}% {data.isCharging && '(Charging)'}</span>
          </div>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-icon"><Globe size={20} /></div>
          <div className="telemetry-info"><span className="label">IP addresses</span><span className="value">Server-seen: {data.publicIp || 'unavailable'}<br />Phone LAN: {data.localIp || 'unavailable'}</span></div>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-icon"><ShieldCheck size={20} className={data.accessibilityEnabled ? 'connected' : ''} /></div>
          <div className="telemetry-info"><span className="label">Remote touch</span><span className="value">{data.accessibilityEnabled ? 'Enabled' : 'Enable on phone'}</span></div>
        </div>
        
        <div className="telemetry-item">
          <div className="telemetry-icon">
            <Wifi size={20} className={data.networkType === 'WIFI' ? 'connected' : ''} />
          </div>
          <div className="telemetry-info">
            <span className="label">Network</span>
            <span className="value">{data.networkType}</span>
          </div>
        </div>

        <div className="telemetry-item">
          <div className="telemetry-icon">
            <Smartphone size={20} />
          </div>
          <div className="telemetry-info">
            <span className="label">Resolution</span>
            <span className="value">{data.nativeWidth} x {data.nativeHeight}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
