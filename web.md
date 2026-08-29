**GhostTouch** is a web-based remote administration framework that allows real-time screen mirroring, touch and gesture injection, and live GPS location/telemetry tracking for Android devices over encrypted WebRTC connections.

---

## Repository Structure (Monorepo Setup)

Yes, keeping both the mobile and web projects inside a single **Monorepo** is the cleanest approach. It allows you to share data models (like JSON message definitions between WebRTC data channels) and manage the entire codebase under one version control system.

```text
ghosttouch/                         # Root Repository
├── apps/
│   ├── web/                        # React + TypeScript + Vite (Web Dashboard)
│   └── mobile/                     # Flutter App (Android Client)
├── packages/
│   └── protocol/                   # Shared TypeScript/Dart JSON schemas & types
├── infrastructure/
│   ├── signaling/                  # Node.js WebSocket Signaling Server
│   └── docker-compose.yml          # Coturn STUN/TURN configuration
├── README.md                       # Project overview
└── package.json                    # Workspace scripts

```

---

## Web Dashboard Specification (`ghosttouch-web`)

The web app serves as the central control terminal. Since you are building the web dashboard first, you can use mock WebRTC data channels to build and test the entire UI before connecting the Flutter mobile client.

```text
+-----------------------------------------------------------------------------------+
| GHOSTTOUCH WEB DASHBOARD                                                          |
+------------------------------------+----------------------------------------------+
|                                    |  [ TELEMETRY & STATUS ]                      |
|  [ PHONE SCREEN STREAM ]           |  Battery: 85% [Charging]  | Network: Wi-Fi   |
|                                    |  Device: Galaxy S23 (1080x2340)               |
|                                    |----------------------------------------------|
|                                    |  [ LIVE GPS LOCATION MAP ]                   |
|  <video> viewport                  |  +----------------------------------------+  |
|  (Captures clicks & mouse moves)   |  | OpenStreetMap / Leaflet View              |  |
|                                    |  |                                        |  |
|                                    |  |                 (📍 Marker)            |  |
|                                    |  +----------------------------------------+  |
|                                    |  Lat: 34.020882, Lng: -6.841650             |
|                                    |----------------------------------------------|
|                                    |  [ REMOTE SYSTEM ACTIONS ]                   |
|                                    |  [ BACK ]    [ HOME ]    [ RECENTS ]         |
+------------------------------------+----------------------------------------------+

```

---

### 1. Key Features & Dashboard Modules

1. **Connection Manager:** Handles signaling, PIN authentication, WebRTC state transitions, and connection status indicators (Disconnected, Connecting, Live, Reconnecting).
2. **Interactive Phone Viewport:** Plays the incoming WebRTC video stream in real-time. Captures mouse down, mouse up, and mouse drag events to transform them into native phone gestures.
3. **Live GPS Map:** An interactive map component (built with Leaflet/OpenStreetMap) that renders the phone's live location, pin marker, accuracy radius, and historical path.
4. **Telemetry Panel:** Real-time diagnostics display updated via the WebRTC data channel (battery percentage, charging status, network type, storage usage, native screen resolution).
5. **Quick Control Bar:** Soft key triggers for global Android system actions (Back, Home, Recent Apps, Lock Screen).

---

### 2. Connection Flow & Handshake

* Step 1: Signaling Socket Init
Web app connects to `wss://signaling.yourdomain.com` and listens for connection status events.


* Step 2: PIN Submission & Offer Generation
User enters the 6-digit PIN displayed on the phone. The web client creates an `RTCPeerConnection`, creates an SDP **Offer**, and emits it through the WebSocket to the targeted phone ID.


* Step 3: SDP Answer & ICE Candidate Swap
The phone accepts the offer and responds with an SDP **Answer**. Both endpoints exchange ICE candidates through the signaling server to establish a direct WebRTC connection (or relay via TURN).


* Step 4: Track & Channel Handshake
The web client receives the incoming remote `MediaStreamTrack` and attaches it to the `<video>` element. Simultaneously, the `RTCDataChannel` ("control-channel") opens to handle touch events and telemetry packets.


---

### 3. Component Architecture & State Management

```text
src/
├── assets/
├── components/
│   ├── connection/
│   │   ├── PinModal.tsx             # PIN input & session initialization
│   │   └── StatusBadge.tsx          # Real-time WebRTC state indicator
│   ├── stream/
│   │   ├── PhoneViewport.tsx        # Video element & mouse gesture listeners
│   │   └── SystemControlBar.tsx     # Home, Back, Recents triggers
│   ├── telemetry/
│   │   ├── TelemetryCard.tsx        # Battery, network, system specs
│   │   └── LocationMap.tsx          # Leaflet map displaying GPS coordinates
├── hooks/
│   ├── useSignaling.ts              # WebSocket logic for pairing
│   ├── useWebRTC.ts                 # PeerConnection lifecycle & track mapping
│   └── useCoordinateScaler.ts       # Normalizes mouse positions to mobile screen
├── types/
│   └── protocol.ts                  # Message schemas for DataChannel JSON payloads
├── App.tsx
└── main.tsx

```

---

### 4. Technical Implementation Details

#### Touch Coordinate Translation Math

When a user clicks inside the web video component, mouse coordinates must be scaled to the native Android screen resolution before sending them through the data channel:

```typescript
// hooks/useCoordinateScaler.ts
export interface TouchEventPayload {
  type: 'TOUCH';
  action: 'DOWN' | 'MOVE' | 'UP';
  x: number;
  y: number;
}

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

```

#### Telemetry & GPS Data Channel Schema

The web dashboard listens to inbound JSON packets on the WebRTC data channel and updates state accordingly:

```typescript
// Types for incoming data from the phone
export type PhoneIncomingMessage =
  | {
      type: 'TELEMETRY_UPDATE';
      payload: {
        batteryLevel: number; // 0 - 100
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
        accuracy: number; // in meters
        altitude?: number;
        speed?: number;
        timestamp: number;
      };
    };

```

---

### 5. Recommended Web Technologies & Dependencies

* **Framework:** React 18+ with TypeScript (Vite bundler)
* **Styling:** Tailwind CSS (fast layout building for dashboards)
* **Icons:** Lucide React (`lucide-react`)
* **Map Engine:** Leaflet + `react-leaflet` (Lightweight, no API keys required like Google Maps)
* **WebRTC Abstraction:** Standard browser `window.RTCPeerConnection` API (no heavy wrappers needed)