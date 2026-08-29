# GhostTouch: Technical Specification & Architecture Manual

## 1. Project Overview & Scope

**GhostTouch** is a cross-platform remote administration framework designed to provide low-latency screen mirroring, remote touch gesture injection, and real-time telemetry/location monitoring from a web browser to an Android device over WebRTC.

### Core Objectives

* **Low-Latency Video Streaming:** Real-time hardware-accelerated screen capture via native Android APIs piped over WebRTC media tracks.
* **Remote Touch Injection:** Conversion of browser mouse events into native Android touch/gesture events via Android Accessibility Services.
* **Telemetry & Location Monitoring:** On-demand GPS coordinates, network status, and battery diagnostics streamed over WebRTC data channels.
* **WAN & LAN Traversal:** P2P connection setup via WebSockets signaling, backed by STUN/TURN infrastructure for cross-network connectivity.

---

## 2. Technical Stack & Component Matrix

| Layer | Component | Technologies | Purpose |
| --- | --- | --- | --- |
| **Mobile App** | Interface & WebRTC | Flutter (Dart) | PeerConnection lifecycle, signaling client, state management |
| **Mobile Native** | OS Integration | Kotlin (Android SDK) | `MediaProjection` (screen capture), `AccessibilityService` (touch injection), `LocationManager` |
| **Web Terminal** | Command Center | React, TypeScript, HTML5 | Canvas/Video rendering, mouse-to-touch coordinate translation, telemetry dashboard |
| **Signaling** | Matchmaker | Node.js, WebSockets (`ws`) | SDP Offer/Answer exchange, ICE Candidate routing, authentication |
| **Relay** | WAN Traversal | Docker, Coturn (STUN/TURN) | Packet relaying for endpoints behind strict symmetric NATs |

---

## 3. System Architecture & Control Flow

```text
+-----------------------------------------------------------------------------------+
|                                  GHOSTTOUCH SYSTEM                                |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ Web Client (React) ] <----( WSS Signaling )----> [ Node.js Server ]            |
|            |                                              ^                       |
|            |                                              |                       |
|            |                                    ( WSS Signaling )                 |
|            |                                              |                       |
|            v                                              v                       |
|  [ Web Client (React) ] <====( WebRTC Video Track )==== [ Android Device ]        |
|                         ====( WebRTC Data Channel )===>                           |
|                                                                                   |
+-----------------------------------------------------------------------------------+

```

### Connection Sequence

1. **Device Registration:** The Android app connects to the signaling server via secure WebSockets (`wss://`) and receives a dynamic 6-digit session key.
2. **Session Handshake:** The Web Terminal submits the session key to request a pairing. The signaling server relays the SDP Offer from the web client to the phone.
3. **P2P Establishment:** Mobile and Web clients trade ICE candidates. The connection upgrades to a direct WebRTC peer-to-peer connection encrypted via DTLS-SRTP.
4. **Data Delivery:**
* **Video Stream:** Android `MediaProjection` surface $\rightarrow$ `flutter_webrtc` VideoTrack $\rightarrow$ Web Browser `<video>` element.
* **Control Commands:** Browser mouse events $\rightarrow$ DataChannel JSON $\rightarrow$ Kotlin `AccessibilityService` $\rightarrow$ System Gesture.



---

## 4. Module Specifications

### 4.1 Mobile Endpoint (Android / Flutter)

**Declared Permissions (`AndroidManifest.xml`)**

* `INTERNET` - Required for signaling and WebRTC streaming.
* `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_MEDIA_PROJECTION` - Mandatory for continuous background screen capture.
* `ACCESS_FINE_LOCATION` & `ACCESS_BACKGROUND_LOCATION` - Required for telemetry and location tracking.
* `BIND_ACCESSIBILITY_SERVICE` - Grants power to inject touches.

**Native Touch Injection Engine (`AccessibilityService.kt`)**
To simulate touches, the native service receives parsed X/Y coordinates and dispatches a path stroke:

```kotlin
fun injectTap(x: Float, y: Float) {
    val path = Path().apply { moveTo(x, y) }
    val stroke = GestureDescription.StrokeDescription(path, 0, 50) // 50ms tap duration
    val gesture = GestureDescription.Builder().addStroke(stroke).build()
    
    dispatchGesture(gesture, object : GestureResultCallback() {
        override fun onCompleted(gestureDescription: GestureDescription?) {
            // Touch executed successfully
        }
    }, null)
}

```

### 4.2 Web Terminal Engine (React / TypeScript)

**Coordinate Scaling Math**
Because the browser viewport dimensions ($w_{web}, h_{web}$) rarely match the phone's native display hardware resolution ($w_{native}, h_{native}$), coordinates must be normalized prior to transmission:

$$x_{phone} = \left( \frac{x_{click} - \text{rect.left}}{w_{video\_element}} \right) \times w_{native}$$

$$y_{phone} = \left( \frac{y_{click} - \text{rect.top}}{h_{video\_element}} \right) \times h_{native}$$

```typescript
// Coordinate mapping payload builder
const createTouchPayload = (
  event: React.MouseEvent<HTMLVideoElement>,
  nativeWidth: number,
  nativeHeight: number
) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const scaleX = nativeWidth / rect.width;
  const scaleY = nativeHeight / rect.height;

  return JSON.stringify({
    type: "TOUCH_EVENT",
    action: "TAP",
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
    timestamp: Date.now()
  });
};

```

---

## 5. Directory Structure Blueprint

```text
ghost-touch/
├── mobile/                           # Flutter Mobile Application
│   ├── android/app/src/main/kotlin/
│   │   └── com/ghosttouch/app/
│   │       ├── MainActivity.kt       # MethodChannel router
│   │       ├── Services/
│   │       │   ├── CaptureService.kt # Foreground MediaProjection holder
│   │       │   └── TouchService.kt   # AccessibilityService gesture engine
│   └── lib/
│       ├── main.dart
│       ├── controllers/webrtc.dart   # PeerConnection & DataChannel logic
│       └── views/dashboard.dart      # Connection status UI
│
├── web/                              # React TypeScript Web Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── ScreenViewer.tsx      # Video canvas & mouse event listener
│   │   │   └── TelemetryPanel.tsx    # GPS & battery stats
│   │   ├── hooks/useWebRTC.ts        # WebRTC connection state machine
│   │   └── App.tsx
│   └── package.json
│
└── infrastructure/                   # Backend & Signaling Services
    ├── signaling/
    │   ├── server.js                 # Node.js WebSocket server
    │   └── package.json
    └── docker-compose.yml            # Coturn STUN/TURN container deployment

```

---

## 6. Security Controls & Android Constraints

* **Explicit User Authorization:** Screen capture cannot run fully silently without root privileges. Every session start requires explicit user interaction with Android's system prompt (*"Start recording or casting with GhostTouch?"*).
* **Persistent System Indicators:** Android displays a persistent status bar icon and notification whenever a Foreground Service utilizing `MediaProjection` or `Location` is active.
* **Transport Layer Security:** Signaling communication is enforced over TLS (`wss://`), and WebRTC channels are mandatory-encrypted using DTLS-SRTP.
* **Input Validation:** The native Kotlin accessibility handler validates that inbound coordinates lie strictly within the device's physical bounds ($0 \le x \le w_{native}$ and $0 \le y \le h_{native}$) to avoid system runtime exceptions.

Here is a complete, structured *Cahier des Charges* and technical documentation blueprint. You can copy and paste this directly into your GitHub repository as your `README.md` to guide your development.

---

# Remote Control Architecture (WebRTC + Android Native)

## 📌 Project Overview

A complete end-to-end system allowing real-time remote control of an Android device from a web browser. The system leverages WebRTC for low-latency video streaming and data channels for instant gesture injection. It is designed to work across local networks (LAN) and wide area networks (WAN) via STUN/TURN infrastructure.

## 🏗️ 1. System Architecture

The architecture relies on a triangular connection model:

1. **Signaling Server:** Introduces the Mobile App and Web Client.
2. **STUN/TURN Relay:** Facilitates network traversal across strict NATs/Firewalls.
3. **P2P WebRTC Connection:** Handles the heavy lifting (Video Stream + Control Data).

## 🛠️ 2. Technology Stack

| Component | Technology | Primary Role |
| --- | --- | --- |
| **Mobile App** | Flutter (Dart) | UI, WebRTC Management, Connection State |
| **Mobile Native** | Kotlin / Java | System APIs (`MediaProjection`, `AccessibilityService`) |
| **Mobile Bridge** | `MethodChannel` | Serializes commands from Flutter to Kotlin |
| **Web Client** | React / Angular (TypeScript) | Video rendering, Mouse event capture, Coordinate math |
| **Signaling** | Node.js (WebSockets) / Go | Exchanging SDP Offers, Answers, and ICE Candidates |
| **Infrastructure** | Docker Compose, Coturn | STUN/TURN deployment for WAN traversal |

---

## ⚙️ 3. Core Components & Implementation Details

### 3.1. Mobile Application (The Sender)

The mobile app acts as the WebRTC Broadcaster and command execution engine.

* **Screen Capture Pipeline:**
* Requires a Foreground Service with a persistent notification (mandatory for modern Android).
* Uses `MediaProjectionManager` to capture screen surfaces.
* Pipes the surface frames into `flutter_webrtc` as a `MediaStreamTrack`.


* **Accessibility & Touch Injection:**
* Requires the user to manually enable the app in Android Accessibility Settings.
* The service configuration XML must include `android:canPerformGestures="true"`.
* Listens on the WebRTC Data Channel for JSON payloads: `{"action": "tap", "x": 500, "y": 800}`.
* Passes the JSON via `MethodChannel` to the native Accessibility Service, triggering `dispatchGesture()`.



### 3.2. Web Client (The Receiver)

The web client consumes the video and translates mouse events into remote commands.

* **Video Playback:**
* Receives the `MediaStream` and attaches it to an HTML5 `<video autoplay playsinline>` element.


* **Coordinate Translation Engine (Crucial):**
* Must dynamically calculate the scale factor.
* **Formula:** `Mobile_X = (Mouse_X / Video_Element_Width) * Native_Device_Width`
* Throttles `onMouseMove` events to prevent flooding the WebRTC data channel when simulating swipes.



### 3.3. Backend & Infrastructure

* **Signaling WebSocket Server:**
* Requires basic session management (mapping a generated `Room ID` or `Device ID` to active WebSocket connections).


* **Coturn (STUN/TURN):**
* Deployed via Docker.
* Configured with long-term credentials (`--lt-cred-mech`) to authenticate your specific apps and prevent bandwidth hijacking.



---

## 🔄 4. The Connection Flow (State Machine)

1. **Initialization:** Mobile app starts Foreground Service -> Connects to WebSocket -> Generates 6-digit PIN.
2. **Handshake:** Web Client connects to WebSocket -> Enters PIN -> Sends WebRTC Offer.
3. **ICE Negotiation:** Both peers request public IPs from the STUN server and exchange ICE candidates via the WebSocket.
4. **Connection:**
* *Direct:* If on the same Wi-Fi, peers connect directly.
* *Relay:* If separated by strict NATs, Coturn acts as a video relay.


5. **Streaming:** Video flows from Mobile to Web. JSON coordinates flow from Web to Mobile.

---

## 🔒 5. Security & Cybersecurity Considerations

Given the nature of the application (functionally similar to remote administration tools), security is paramount:

* **Permission Enforcement:** The app must gracefully handle the revocation of Accessibility permissions by the OS (Android often kills Accessibility services to save battery or for security).
* **Data Channel Validation:** The native Kotlin code must sanitize and validate X/Y coordinate inputs to prevent buffer overflows or logic errors in the gesture dispatcher.
* **Signaling Auth:** The WebSocket server must implement rate-limiting to prevent brute-forcing of the 6-digit connection PINs.
* **Encryption:** WebRTC is encrypted via DTLS/SRTP by default, but ensure your WebSocket signaling server runs over WSS (TLS) to prevent interception of the SDP offers.

---

## 🚀 6. Development Milestones

* **Phase 1: Local Video.** Build the Flutter UI, capture the screen using `MediaProjection`, and render it locally on the phone just to verify the capture pipeline works.
* **Phase 2: Signaling & Web Client.** Build the Node/Go WebSocket server and the Web UI. Establish the WebRTC connection and get the video displaying on the PC.
* **Phase 3: Native Touch Injection.** Implement the Android `AccessibilityService`. Create the `MethodChannel`. Send hardcoded coordinates from Flutter to Kotlin to test taps.
* **Phase 4: The Loop.** Connect the Web UI mouse events to the WebRTC Data Channel, pipe them to Flutter, and finally to Kotlin. Map the coordinates accurately.
* **Phase 5: Infrastructure.** Deploy Coturn via Docker to make the application work across cellular networks.

---

To have unattended remote access to your phone when you are away from home, the app **does not need to be opened manually every time**, but modern Android security enforces one specific limitation regarding screen recording that you must account for.

Here is how persistent background access works on Android, along with the OS security barriers you will encounter.

---

## 1. How Auto-Start Works (`RECEIVE_BOOT_COMPLETED`)

To ensure the app is running whenever the phone is powered on, you do not need to launch it manually. You configure Android to start your app's background service automatically when the phone boots up.

* **BroadcastReceiver:** You register a receiver in your Android Manifest for `android.intent.action.BOOT_COMPLETED`.
* **Foreground Service:** When the system boots, your receiver catches the signal and immediately starts your app's persistent Foreground Service.
* **WebSocket Connection:** The background service opens the WebSocket connection to your cloud signaling server. The phone is now online and waiting for connection requests from your PC web dashboard.

---

## 2. The Main Obstacle: Unattended Screen Capture

While starting the network connection in the background is straightforward, **capturing the screen without physical interaction is deliberately restricted by Android for anti-spyware security.**

### The `MediaProjection` Security Guardrail

On modern Android versions (Android 10 through 14+):

* Every time a screen recording session is initiated, the OS presents a system consent dialog asking the user to confirm screen capture (*"Start recording or casting?"*).
* Android **prohibits apps from bypassing or programmatically clicking this dialog** through standard app APIs.
* If the phone reboots or the foreground service restarts, Android typically requires the user to press "Start Now" again before screen frames can be grabbed.

---

## 3. How Unattended Remote Access is Achieved

If your goal is genuine unattended access for personal use (e.g., when the phone is left at home), developers and legitimate remote tools use one of three approaches:

### A. ADB (Android Debug Bridge) over TCP/IP

If you enable **Wireless Debugging / ADB over Wi-Fi** on your phone:

* ADB runs with elevated developer privileges.
* Tools like `scrcpy` use ADB commands directly (`adb exec-out screenrecord`) to bypass the `MediaProjection` popup entirely.
* **How it works remotely:** You can run an ADB server on a home device (like a Raspberry Pi or always-on PC) connected to the phone, or route ADB over a VPN (like Tailscale) back to your work PC.

### B. Device Admin / MDM (Mobile Device Management)

Enterprise management applications (like Samsung Knox or Android Enterprise MDM) are granted special system-level certificates that allow silent screen capture and remote control without user prompts. However, standard Google Play store apps or user-installed APKs do not possess these system signatures.

### C. Keeping the Session Alive

If the phone stays turned on and connected to power at home:

* You authorize the `MediaProjection` screen recording prompt **once** while you are physically with the phone.
* As long as the phone does not reboot and the foreground service remains active, the session stays warm, allowing you to connect and disconnect remotely from your work browser throughout the day.

---

## Summary Overview

| Feature | Standard App Behavior | With Boot Receiver | ADB / Developer Mode |
| --- | --- | --- | --- |
| **Network Standby** | Manual start required | Automatic on boot | Automatic |
| **Touch Controls** | Works remotely | Works remotely | Works remotely |
| **Screen Streaming** | Requires tap on popup | **Blocked by OS popup** | **Bypasses OS popup** |