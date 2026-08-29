export interface TouchEventPayload {
  type: 'TOUCH';
  action: 'DOWN' | 'MOVE' | 'UP';
  x: number;
  y: number;
}

export type PhoneIncomingMessage =
  | {
      type: 'TELEMETRY_UPDATE';
      payload: {
        batteryLevel: number;
        isCharging: boolean;
        networkType: 'WIFI' | 'CELLULAR' | 'NONE';
        nativeWidth: number;
        nativeHeight: number;
      };
    }
  | {
      type: 'LOCATION_UPDATE';
      payload: {
        latitude: number;
        longitude: number;
        accuracy: number;
        altitude?: number;
        speed?: number;
        timestamp: number;
      };
    };
