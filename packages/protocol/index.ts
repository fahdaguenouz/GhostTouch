export interface TouchEventPayload {
  type: 'TOUCH';
  action: 'DOWN' | 'MOVE' | 'UP';
  x: number;
  y: number;
}

export interface DeviceTelemetry {
  batteryLevel: number;
  isCharging: boolean;
  networkType: 'WIFI' | 'CELLULAR' | 'ETHERNET' | 'NONE' | 'UNKNOWN';
  nativeWidth: number;
  nativeHeight: number;
  deviceName?: string;
  manufacturer?: string;
  model?: string;
  androidVersion?: string;
  localIp?: string;
  publicIp?: string;
  accessibilityEnabled?: boolean;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
}

export type PhoneIncomingMessage =
  | {
      type: 'TELEMETRY_UPDATE';
      payload: DeviceTelemetry;
    }
  | {
      type: 'LOCATION_UPDATE';
      payload: DeviceLocation;
    };

export type ControlMessage =
  | TouchEventPayload
  | { type: 'SYSTEM_ACTION'; action: 'BACK' | 'HOME' | 'RECENTS' };
