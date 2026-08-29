import React from 'react';
import { ArrowLeft, Home, CopySlash } from 'lucide-react';
import './stream.css';

interface SystemControlBarProps {
  onAction: (action: 'BACK' | 'HOME' | 'RECENTS') => void;
}

export const SystemControlBar: React.FC<SystemControlBarProps> = ({ onAction }) => {
  return (
    <div className="system-control-bar glass-panel">
      <button className="nav-btn" onClick={() => onAction('RECENTS')} title="Recent Apps">
        <CopySlash size={24} />
      </button>
      <button className="nav-btn" onClick={() => onAction('HOME')} title="Home">
        <Home size={24} />
      </button>
      <button className="nav-btn" onClick={() => onAction('BACK')} title="Back">
        <ArrowLeft size={24} />
      </button>
    </div>
  );
};
