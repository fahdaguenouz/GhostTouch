# ghosttouch_mobile

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Environment Variables & API Keys

To display the phone status, battery, network IP, and location accurately in the web dashboard, you must configure an `.env` file.

### 1. Create the `.env` file
In the root directory of the mobile app (`apps/mobile/`), create a file named `.env`:

```bash
touch .env
```

### 2. Required Keys
Add the following keys to your `.env` file:

```env
# Required for Network IP and Location mapping
IPINFO_API_KEY=your_api_key_here
```

### 3. Where to get the keys
- **IPINFO_API_KEY**: Go to [ipinfo.io](https://ipinfo.io/), sign up for a free account, and get your API token from the dashboard. This service converts the phone's IP address into geolocation and network status.

**Note**: To fully take control of the phone, ensure that the **Accessibility Service** and **Screen Capture** permissions are explicitly granted when the app launches. If these are not granted, touches will not register on the dashboard.
