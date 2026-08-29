import React, { useState } from 'react';
import { KeyRound, Link, Link2Off } from 'lucide-react';
import './connection.css';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'LIVE';

interface ConnectionManagerProps {
  connectionState: ConnectionState;
  onConnect: (pin: string) => void;
  onDisconnect: () => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  connectionState,
  onConnect,
  onDisconnect,
}) => {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      onConnect(pin);
    }
  };

  return (
    <div className="connection-manager glass-panel">
      <div className="connection-header">
        <h3>Session Control</h3>
        <div className={`status-badge ${connectionState.toLowerCase()}`}>
          {connectionState === 'LIVE' ? <Link size={14} /> : <Link2Off size={14} />}
          <span>{connectionState}</span>
        </div>
      </div>

      {connectionState === 'DISCONNECTED' ? (
        <form onSubmit={handleSubmit} className="connection-form">
          <div className="input-group">
            <KeyRound size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Enter 6-Digit PIN"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="pin-input"
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={pin.length !== 6}
          >
            Connect to Device
          </button>
        </form>
      ) : (
        <div className="connection-actions">
          <button 
            onClick={onDisconnect} 
            className="btn btn-outline disconnect-btn"
          >
            End Session
          </button>
        </div>
      )}
    </div>
  );
};
