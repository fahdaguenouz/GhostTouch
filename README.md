# GhostTouch 📱👻
---
> **Consent-based Android remote support and device monitoring platform built with Flutter, React, WebRTC, and native Android APIs.**

GhostTouch is a cross-platform remote-support framework that allows an authorized operator to connect to an Android device from a web dashboard.

Once a session has been explicitly authorized on the Android device, GhostTouch can provide:

* 📱 Real-time Android screen streaming
* 🖱️ Remote touch and gesture interaction
* 📍 Live device location and telemetry
* 🔋 Battery and network information
* 🌐 LAN and WAN connectivity through WebRTC
* 🔐 Encrypted peer-to-peer communication
* 🔄 WebSocket-based signaling
* 🛰️ STUN/TURN support for NAT traversal

GhostTouch is designed for **personal devices, authorized remote-support scenarios, development, testing, and controlled security laboratories**.

---
## 🚀 Features

* **Low-Latency Screen Mirroring:** Hardware-accelerated screen capture on Android piped directly to your web browser via WebRTC.
* **Remote Touch Injection:** Seamless conversion of browser clicks and drags into native Android gestures using Accessibility Services.
* **Live Telemetry & GPS:** Real-time updates for battery life, network status, screen resolution, and GPS coordinates via WebRTC Data Channels.
* **WAN & LAN Support:** Peer-to-peer connections facilitated by a WebSocket signaling server and STUN/TURN relays for traversing strict NATs.
* **Monorepo Architecture:** Clean separation of concerns with shared TypeScript protocols between the Web Client and signaling infrastructure.

## 🏗️ Architecture

The project is structured as a modern Monorepo:

```text
ghosttouch/
├── apps/
│   ├── web/               # React + TypeScript + Vite Dashboard
│   └── mobile/            # (WIP) Flutter Android Client
├── packages/
│   └── protocol/          # Shared Types & WebRTC JSON Schemas
└── infrastructure/
    └── signaling/         # (WIP) Node.js WebSocket Server & Docker Compose
```

## 🛠️ Tech Stack

### Web Dashboard (`apps/web`)
* **Framework:** React 19 + TypeScript + Vite
* **Styling:** Highly Polished Premium Vanilla CSS (Glassmorphism & Dark Mode)
* **Icons:** Lucide React
* **Mapping:** Leaflet & React-Leaflet
* **Connection:** WebRTC (PeerConnection & DataChannels)

### Mobile Endpoint (`apps/mobile`) - Upcoming
* **UI:** Flutter (Dart)
* **Native:** Kotlin (Android SDK)
* **APIs:** `MediaProjection`, `AccessibilityService`, `LocationManager`

# 🏃 Getting Started & Usage Guide

Follow these instructions to run the GhostTouch system locally.

### 1. Web Dashboard (`apps/web`)

The web dashboard is a React application built with Vite. It serves as the control center where you can view the phone screen and send touch commands.

**Installation & Running:**
```bash
# 1. Install all dependencies from the root directory
npm install

# 2. Start the web dashboard dev server
cd apps/web
npm run dev
```
Visit `http://localhost:5173` in your browser.

### 2. Mobile Client (`apps/mobile`)

The Android application is built with Flutter. It captures the screen, handles native touch injection via Accessibility Services, and communicates with the web dashboard.

**Installation & Running:**
1. Ensure you have the [Flutter SDK](https://docs.flutter.dev/get-started/install) installed and an Android device connected via ADB (or a high-performance emulator).
2. Install dependencies and run:
```bash
cd apps/mobile
flutter pub get
flutter run
```

### 3. How to Connect (The Code Digits)

GhostTouch uses a 6-digit **PIN** (Code Digits) to securely pair the web dashboard with your mobile device.

1. **Launch the Mobile App:** Open the GhostTouch app on your Android device. The app will automatically generate a random **6-digit PIN** displayed in large text on the center of the screen.
2. **Launch the Web Dashboard:** Open the dashboard in your browser (`http://localhost:5173`).
3. **Enter the PIN:** In the Web Dashboard's "Session Control" panel on the right, type in the exact 6-digit PIN shown on your phone.
4. **Connect:** Click "Connect to Device". The dashboard will initiate a WebRTC handshake with the phone.
5. **Grant Permissions (Android):** When prompted on your phone, you must explicitly tap **"Start Now"** to allow GhostTouch to capture your screen, and you must enable the GhostTouch Accessibility Service in your Android settings to allow remote touch control.

Once paired, the phone screen will appear in the web browser, and any clicks or drags inside the video player will be injected directly into the Android device!

---
*Built for seamless, encrypted remote control and telemetry.*

## 🔒 Security Constraints

GhostTouch operates under standard modern Android security boundaries:
* **Screen Capture:** Requires explicit user authorization on the Android device via a system prompt.
* **Touch Injection:** Requires manual authorization of the GhostTouch Accessibility Service.
* **Encryption:** All WebRTC streams (Video & Data) are mandatory-encrypted using DTLS-SRTP.

### 📺 Real-Time Screen Mirroring

The Android application captures its display using Android's `MediaProjection` API and publishes the resulting video through WebRTC.

The web dashboard receives the WebRTC `MediaStreamTrack` and renders it inside an HTML5 video element.

```text
Android Screen
      │
      ▼
MediaProjection
      │
      ▼
WebRTC VideoTrack
      │
      ▼
Web Browser
      │
      ▼
<video>
```

The architecture is designed around low-latency WebRTC rather than sending screenshots through the backend.

---

### 🖱️ Remote Touch & Gesture Control

GhostTouch converts interactions inside the browser's phone viewport into coordinates corresponding to the Android device's native display.

For example:

```text
Browser Mouse Event
        │
        ▼
Coordinate Normalization
        │
        ▼
WebRTC DataChannel
        │
        ▼
Flutter
        │
        ▼
Native Kotlin
        │
        ▼
AccessibilityService
        │
        ▼
Android Gesture
```

The browser does not assume that its viewport has the same dimensions as the Android display.

Coordinates are therefore transformed from browser space into native Android screen space.

### Coordinate transformation

```text
phoneX = ((mouseX - video.left) / video.width)  × nativeWidth
phoneY = ((mouseY - video.top)  / video.height) × nativeHeight
```

This allows a click anywhere inside the remote phone viewport to correspond to the appropriate location on the Android device.

---

### 📍 Live Location

The Android client can transmit location information through the WebRTC data channel.

Example:

```json
{
  "type": "LOCATION_UPDATE",
  "payload": {
    "latitude": 34.020882,
    "longitude": -6.841650,
    "accuracy": 8.5,
    "altitude": 42.1,
    "speed": 0,
    "timestamp": 1756479600000
  }
}
```

The web dashboard can display:

* Current coordinates
* Accuracy radius
* Altitude
* Speed
* Last update timestamp
* Historical movement path

The location feature should only be enabled with the device owner's knowledge and authorization.

---

### 🔋 Device Telemetry

The Android client can periodically publish diagnostic information.

Example:

```json
{
  "type": "TELEMETRY_UPDATE",
  "payload": {
    "batteryLevel": 85,
    "isCharging": true,
    "networkType": "WIFI",
    "nativeWidth": 1080,
    "nativeHeight": 2340
  }
}
```

The dashboard can use this information to display the current device state.

Possible telemetry includes:

| Metric     | Description                       |
| ---------- | --------------------------------- |
| Battery    | Current battery percentage        |
| Charging   | Whether the device is charging    |
| Network    | Wi-Fi / Cellular / None           |
| Resolution | Native Android display dimensions |
| Storage    | Available device storage          |
| Connection | WebRTC connection state           |
| Location   | Current GPS information           |

---

# 🏗️ Architecture

GhostTouch consists of three major layers:

```text
                     ┌─────────────────────────┐
                     │     Web Dashboard       │
                     │ React + TypeScript      │
                     └────────────┬────────────┘
                                  │
                           WebSocket / WSS
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   Signaling Server      │
                     │ Node.js + WebSocket     │
                     └────────────┬────────────┘
                                  │
                           SDP / ICE exchange
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌──────────────────┐        ┌─────────────────┐
          │   Web Browser    │◄══════►│ Android Device  │
          │                  │ WebRTC │                 │
          │ Video + Control │        │ Flutter + Kotlin│
          └──────────────────┘        └─────────────────┘
                    ▲                           ▲
                    │                           │
                    └────────── TURN ───────────┘
                              optional
```

### Components

| Component            | Technology                | Responsibility               |
| -------------------- | ------------------------- | ---------------------------- |
| Web Dashboard        | React + TypeScript + Vite | Remote interface             |
| Android Client       | Flutter + Dart            | Mobile application           |
| Android Native Layer | Kotlin                    | OS-level integrations        |
| Signaling            | Node.js + WebSocket       | SDP/ICE/session coordination |
| P2P Transport        | WebRTC                    | Video + control data         |
| NAT Traversal        | Coturn                    | STUN/TURN                    |
| Maps                 | Leaflet + OpenStreetMap   | Location visualization       |
| Styling              | Tailwind CSS              | Dashboard UI                 |

The signaling server is primarily responsible for helping peers discover and establish a WebRTC connection. The actual video/control traffic is intended to travel directly between peers whenever network conditions allow.

---

# 🔐 Connection & Handshake

A typical GhostTouch session follows this sequence.

## 1. Android Registration

The Android client connects to the signaling service using a secure WebSocket connection:

```text
Android
   │
   │ WSS
   ▼
Signaling Server
```

The device receives a temporary session identifier/PIN.

---

## 2. Session Authentication

The operator enters the displayed session credential into the web dashboard.

The signaling service verifies that the requested device/session exists and that the pairing request is authorized.

---

## 3. SDP Negotiation

The web client creates an `RTCPeerConnection` and generates an SDP offer.

```text
Web Client
    │
    │ SDP Offer
    ▼
Signaling Server
    │
    │
    ▼
Android Client
```

The Android client returns an SDP answer.

---

## 4. ICE Candidate Exchange

Both peers exchange ICE candidates through the signaling server.

```text
Browser ◄──── Signaling ────► Android
              ICE
```

WebRTC then attempts to establish the best available path.

Possible connection paths include:

```text
Direct LAN
    │
    ▼
Browser ◄────────────► Android


Direct WAN
    │
    ▼
Browser ◄────────────► Android


TURN Relay
    │
    ▼
Browser ◄────► TURN ◄────► Android
```

---

## 5. WebRTC Session

Once the peer connection succeeds:

```text
Video Track
Android ─────────────────────► Browser

Data Channel
Android ◄─────────────────────► Browser
```

The video track carries the screen stream.

The data channel carries structured control and telemetry messages.

---

# 📡 Data Channel Protocol

GhostTouch uses JSON messages over WebRTC data channels.

A shared protocol package should define the message structures used by both applications.

## Incoming telemetry

```typescript
type TelemetryUpdate = {
  type: "TELEMETRY_UPDATE";

  payload: {
    batteryLevel: number;
    isCharging: boolean;

    networkType:
      | "WIFI"
      | "CELLULAR"
      | "NONE";

    nativeWidth: number;
    nativeHeight: number;
  };
};
```

## Location update

```typescript
type LocationUpdate = {
  type: "LOCATION_UPDATE";

  payload: {
    latitude: number;
    longitude: number;

    accuracy: number;

    altitude?: number;
    speed?: number;

    timestamp: number;
  };
};
```

## Touch event

```typescript
type TouchEvent = {
  type: "TOUCH_EVENT";

  action:
    | "DOWN"
    | "MOVE"
    | "UP";

  x: number;
  y: number;

  timestamp: number;
};
```

Keeping these schemas centralized prevents the Flutter and React applications from developing incompatible message formats.

---

# 📂 Repository Structure

GhostTouch uses a monorepo architecture so that the web application, mobile application, protocol definitions, and infrastructure remain in one repository.

```text
ghosttouch/
│
├── apps/
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── connection/
│   │   │   │   │   ├── PinModal.tsx
│   │   │   │   │   └── StatusBadge.tsx
│   │   │   │   │
│   │   │   │   ├── stream/
│   │   │   │   │   ├── PhoneViewport.tsx
│   │   │   │   │   └── SystemControlBar.tsx
│   │   │   │   │
│   │   │   │   └── telemetry/
│   │   │   │       ├── TelemetryCard.tsx
│   │   │   │       └── LocationMap.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useSignaling.ts
│   │   │   │   ├── useWebRTC.ts
│   │   │   │   └── useCoordinateScaler.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── protocol.ts
│   │   │   │
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   │
│   │   └── package.json
│   │
│   └── mobile/
│       ├── android/
│       │   └── app/src/main/kotlin/
│       │       └── com/ghosttouch/app/
│       │           ├── MainActivity.kt
│       │           └── Services/
│       │               ├── CaptureService.kt
│       │               └── TouchService.kt
│       │
│       ├── lib/
│       │   ├── controllers/
│       │   │   └── webrtc.dart
│       │   ├── views/
│       │   │   └── dashboard.dart
│       │   └── main.dart
│       │
│       └── pubspec.yaml
│
├── packages/
│   └── protocol/
│       ├── schemas/
│       └── README.md
│
├── infrastructure/
│   ├── signaling/
│   │   ├── server.js
│   │   └── package.json
│   │
│   └── docker-compose.yml
│
├── README.md
└── package.json
```

---

# 🖥️ Web Dashboard

The dashboard acts as the operator interface.

A typical layout:

```text
┌─────────────────────────────────────────────────────────────┐
│                     GHOSTTOUCH                              │
├──────────────────────────────┬──────────────────────────────┤
│                              │ CONNECTION                   │
│                              │ ● LIVE                       │
│       PHONE VIEW             │                              │
│                              ├──────────────────────────────┤
│      ┌──────────────┐        │ TELEMETRY                    │
│      │              │        │                              │
│      │   Android    │        │ Battery      85%             │
│      │    Screen    │        │ Network      Wi-Fi           │
│      │              │        │ Resolution   1080×2340       │
│      │              │        │                              │
│      └──────────────┘        ├──────────────────────────────┤
│                              │ LOCATION                     │
│                              │                              │
│                              │       ┌──────────────┐       │
│                              │       │      📍      │       │
│                              │       └──────────────┘       │
│                              │                              │
├──────────────────────────────┴──────────────────────────────┤
│                    REMOTE CONTROLS                           │
│              [ BACK ] [ HOME ] [ RECENTS ]                  │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard modules

#### Connection Manager

Responsible for:

* Pairing
* Session authentication
* WebSocket connection
* WebRTC lifecycle
* Connection state
* Reconnection handling

Example states:

```text
DISCONNECTED
     │
     ▼
 CONNECTING
     │
     ▼
 CONNECTED
     │
     ├────► RECONNECTING
     │
     ▼
    LIVE
```

#### Phone Viewport

Responsible for:

* Rendering the remote video
* Detecting pointer/touch interaction
* Coordinate translation
* Gesture generation
* Input throttling

#### Telemetry Panel

Displays the latest device state.

#### Location Map

Displays:

* Current position
* Accuracy radius
* Last update
* Optional historical path

---

# 📱 Android Application

The Android application is divided into two layers.

## Flutter

Flutter handles:

* Application UI
* WebRTC lifecycle
* Signaling client
* Session state
* Data channel communication
* User-facing permission workflows

## Native Kotlin

Kotlin handles Android functionality that requires native APIs.

Important Android components include:

### MediaProjection

Used for user-authorized screen capture.

```text
MediaProjection
       │
       ▼
 Screen Surface
       │
       ▼
 WebRTC Video Track
```

### AccessibilityService

Used for authorized gesture interaction.

The service receives validated coordinates and can construct Android gesture descriptions.

### LocationManager

Provides device location data subject to Android permission and lifecycle requirements.

---

# 🔒 Security Model

Security is a core requirement because GhostTouch provides powerful remote functionality.

## Explicit authorization

GhostTouch should only be used on devices where the owner/operator has explicitly authorized the session.

The Android operating system intentionally places restrictions around screen capture and accessibility functionality.

Standard applications cannot silently bypass Android's screen-recording consent mechanisms. The project therefore treats Android's permission and consent mechanisms as security boundaries rather than attempting to circumvent them.

---

## Encrypted signaling

Signaling should be exposed through TLS:

```text
wss://signaling.example.com
```

Never deploy authentication or session credentials over unencrypted WebSockets in production.

---

## WebRTC encryption

WebRTC media and data channels use authenticated encrypted transports such as DTLS-SRTP.

The signaling server is responsible for coordination rather than becoming the default destination for the video stream.

---

## Session authentication

Temporary pairing credentials should:

* Be short-lived
* Have limited attempts
* Be rate-limited
* Be invalidated after successful pairing
* Not be reused indefinitely

Because a six-digit credential has a limited search space, brute-force protection is essential.

---

## Input validation

All incoming commands must be treated as untrusted input.

For touch coordinates:

```text
0 ≤ x ≤ nativeWidth
0 ≤ y ≤ nativeHeight
```

The Android side should validate:

* Message type
* Action
* Numeric values
* Coordinate boundaries
* Message size
* Session ownership
* Command permissions

---

# ⚠️ Android Platform Limitations

GhostTouch does **not** attempt to bypass Android security restrictions.

Modern Android versions require explicit user interaction for screen-capture sessions.

In particular:

```text
Application
     │
     ▼
MediaProjection request
     │
     ▼
Android System Consent
     │
     ├── User accepts ──► Capture allowed
     │
     └── User rejects ──► Capture denied
```

A reboot or termination of the capture session can require authorization again depending on Android version and application lifecycle.

The project therefore distinguishes between:

### Network availability

The Android service may be able to reconnect to the signaling infrastructure according to its permitted lifecycle.

### Screen-capture availability

Screen capture remains subject to Android's MediaProjection authorization.

This distinction is important when designing reconnection and background behavior.

---

# 🌐 STUN / TURN

WebRTC peers may not always be able to establish a direct connection.

GhostTouch therefore supports STUN/TURN infrastructure.

```text
                 ┌─────────────┐
                 │   Signaling │
                 │    Server   │
                 └──────┬──────┘
                        │
                  SDP / ICE
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
      Browser                      Android
          │                           │
          └──────────┬────────────────┘
                     │
              Direct WebRTC
                     │
                if possible
                     │
                     ▼
                 Otherwise
                     │
                     ▼
                 ┌───────┐
                 │ TURN  │
                 └───────┘
```

Coturn can be deployed using Docker Compose.

TURN credentials should be protected and should not be publicly reusable.

---

# 🧪 Development Strategy

GhostTouch should be developed incrementally.

## Phase 1 — Dashboard

Build the web interface using mocked data.

Implement:

* Dashboard layout
* Phone viewport
* Connection status
* Telemetry cards
* Location map
* Control buttons

No Android connection is required initially.

---

## Phase 2 — Mock WebRTC

Create a local/mock WebRTC environment.

Test:

* Video rendering
* Data channels
* Connection states
* Reconnection
* Protocol parsing

---

## Phase 3 — Android Screen Capture

Implement the Android capture pipeline.

```text
Android
   │
   ▼
MediaProjection
   │
   ▼
Capture Surface
   │
   ▼
WebRTC
```

First verify local capture before introducing remote control.

---

## Phase 4 — Signaling

Implement the Node.js signaling server.

Responsibilities:

```text
Device Registration
        │
        ▼
Session Management
        │
        ▼
Pairing
        │
        ▼
SDP Exchange
        │
        ▼
ICE Exchange
```

---

## Phase 5 — WebRTC Connection

Connect the actual Android client to the browser.

Target:

```text
Android ───── WebRTC ───── Browser
```

Verify:

* Connection establishment
* Video track
* Data channel
* Reconnection

---

## Phase 6 — Authorized Input

Implement the Android Accessibility integration and connect it to the data-channel protocol.

Test only against devices/accounts where you have authorization.

---

## Phase 7 — Telemetry & Location

Add:

* Battery monitoring
* Network state
* Screen dimensions
* Location updates
* Map visualization
* Historical path

---

## Phase 8 — TURN Infrastructure

Deploy Coturn and test:

* Same-LAN connection
* Different networks
* Cellular connection
* NAT traversal
* TURN fallback

---

# 🛠️ Recommended Technologies

### Web

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* Leaflet
* React Leaflet
* Native WebRTC APIs

### Android

* Flutter
* Dart
* Kotlin
* Android SDK
* `flutter_webrtc`

### Backend

* Node.js
* WebSocket (`ws`)
* TypeScript/JavaScript

### Infrastructure

* Docker
* Docker Compose
* Coturn

---

# 📦 Example Web Dependencies

```bash
npm install react react-dom
npm install lucide-react
npm install leaflet react-leaflet
```

WebRTC itself is provided by modern browsers and does not require a heavy abstraction layer.

---

# 🧩 Design Principles

GhostTouch follows several architectural principles.

### 1. P2P First

Large media streams should avoid unnecessary backend processing.

```text
Bad:

Android → Server → Browser

Preferred:

Android ◄────────► Browser
          WebRTC
```

The signaling server only coordinates the connection.

---

### 2. Native Android Where Required

Flutter provides the application layer, while Kotlin handles Android functionality that requires native APIs.

```text
Flutter
   │
   │ MethodChannel
   ▼
Kotlin
   │
   ├── MediaProjection
   ├── AccessibilityService
   └── Location APIs
```

---

### 3. Shared Protocol

Web and mobile clients should consume the same protocol specification.

This prevents situations where:

```text
Web expects:

TOUCH_EVENT

Android expects:

TOUCH
```

The shared protocol package becomes the single source of truth.

---

### 4. Security by Default

Security should not be added after the networking layer is finished.

Authentication, authorization, rate limiting, input validation, encryption, and permission handling should be part of the initial architecture.

---

# 🗺️ Roadmap

* [ ] React dashboard
* [ ] Mock device interface
* [ ] WebRTC connection manager
* [ ] Android Flutter client
* [ ] MediaProjection integration
* [ ] Native Android WebRTC bridge
* [ ] WebSocket signaling server
* [ ] Temporary session authentication
* [ ] WebRTC video streaming
* [ ] Data channel protocol
* [ ] Authorized touch interaction
* [ ] Battery telemetry
* [ ] Network telemetry
* [ ] GPS visualization
* [ ] Location history
* [ ] STUN configuration
* [ ] Coturn deployment
* [ ] TURN fallback
* [ ] Session expiration
* [ ] Rate limiting
* [ ] Audit logging
* [ ] Automated integration tests
* [ ] Production deployment

---

# 🧪 Testing

GhostTouch should be tested using dedicated development devices or emulators.

Recommended test categories:

### Web

```text
UI tests
Protocol tests
Coordinate transformation tests
WebRTC state tests
Reconnection tests
```

### Android

```text
Permission tests
MediaProjection lifecycle tests
Accessibility lifecycle tests
Location permission tests
DataChannel parsing tests
Input validation tests
```

### Network

```text
LAN
WAN
NAT
TURN fallback
Connection loss
Reconnection
```

---

# 🔍 Coordinate Transformation Example

Suppose the Android device has:

```text
Native resolution:
1080 × 2340
```

and the browser displays the phone at:

```text
540 × 1170
```

A browser click at:

```text
x = 270
y = 585
```

is translated to:

```text
phoneX = (270 / 540) × 1080
       = 540

phoneY = (585 / 1170) × 2340
       = 1170
```

Therefore the center of the browser viewport maps to the center of the Android display.

The implementation should also account for the actual rendered video rectangle rather than assuming that the video always occupies the entire surrounding container.

---

# 📄 License

Choose an appropriate open-source license before publishing the project.

For example:

```text
MIT License
```

or another license matching the project's intended distribution model.

---

# ⚠️ Responsible Use

GhostTouch provides capabilities that can affect another device remotely. It must only be deployed and used where the operator has appropriate authorization.

Do not use GhostTouch to:

* Access devices without permission
* Monitor people without their knowledge
* Bypass Android security controls
* Evade Android permission prompts
* Circumvent organizational security controls
* Deploy persistent unauthorized access

Android's permission model and user-consent mechanisms are considered part of the security boundary of the project.

---

# 📚 Project Documentation

Additional technical documentation should be maintained for:

```text
/docs
├── architecture.md
├── protocol.md
├── signaling.md
├── webrtc.md
├── android.md
├── security.md
├── deployment.md
└── development.md
```

The README provides the high-level overview, while these documents can contain implementation-specific details.

---

# 👻 GhostTouch

**Remote Android support over WebRTC — designed around low latency, explicit authorization, and a clean separation between signaling, transport, and device control.**

```text
             ┌──────────────────────┐
             │      WEB CLIENT      │
             │   React + TypeScript │
             └──────────┬───────────┘
                        │
                   WebRTC / WSS
                        │
             ┌──────────▼───────────┐
             │   SIGNALING SERVER   │
             │   Node.js + WebSocket│
             └──────────┬───────────┘
                        │
                 SDP / ICE only
                        │
             ┌──────────▼───────────┐
             │    ANDROID CLIENT    │
             │ Flutter + Kotlin     │
             └──────────────────────┘
```

**Build it modular. Keep the protocol shared. Keep the transport encrypted. Keep the user in control.**
