import 'package:flutter/material.dart';
import 'controllers/webrtc.dart';

void main() => runApp(const GhostTouchApp());

class GhostTouchApp extends StatelessWidget {
  const GhostTouchApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'GhostTouch',
    theme: ThemeData.dark().copyWith(colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent, brightness: Brightness.dark), scaffoldBackgroundColor: const Color(0xFF0F1115)),
    home: const DashboardScreen(),
  );
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final WebRTCController controller;
  String pin = '------';
  String status = 'NOT SHARING';
  String? error;
  bool active = false;

  @override
  void initState() {
    super.initState();
    controller = WebRTCController(
      onPin: (v) { if (mounted) setState(() => pin = v); },
      onStatus: (v) { if (mounted) setState(() => status = v); },
      onError: (v) { if (mounted) setState(() => error = v); },
    );
  }

  Future<void> toggleSharing() async {
    setState(() { active = !active; error = null; });
    if (active) { await controller.start(); }
    else { await controller.stop(); if (mounted) setState(() { pin = '------'; status = 'NOT SHARING'; }); }
  }

  @override
  void dispose() { controller.stop(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('GhostTouch Device'), backgroundColor: Colors.transparent),
    body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(28), child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 480),
      child: Column(children: [
        Icon(active ? Icons.screen_share : Icons.mobile_off, size: 72, color: active ? Colors.blueAccent : Colors.grey),
        const SizedBox(height: 22),
        const Text('Consent-based remote support', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        const Text('Start a session only when you want this phone screen and device information visible on your computer.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 30),
        const Text('SESSION PIN', style: TextStyle(color: Colors.grey, letterSpacing: 2)),
        const SizedBox(height: 8),
        SelectableText(pin, style: const TextStyle(fontSize: 44, letterSpacing: 7, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
        const SizedBox(height: 20),
        Chip(label: Text(status), avatar: Icon(active ? Icons.circle : Icons.stop_circle, size: 14, color: active ? Colors.greenAccent : Colors.grey)),
        if (error != null) Padding(padding: const EdgeInsets.only(top: 14), child: Text(error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.orangeAccent))),
        const SizedBox(height: 26),
        SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: toggleSharing, icon: Icon(active ? Icons.stop : Icons.play_arrow), label: Text(active ? 'Stop sharing' : 'Start a support session'))),
        const SizedBox(height: 10),
        SizedBox(width: double.infinity, child: OutlinedButton.icon(onPressed: controller.openAccessibilitySettings, icon: const Icon(Icons.touch_app), label: const Text('Enable remote touch in Accessibility'))),
        const SizedBox(height: 18),
        const Text('Android shows a screen-capture indicator while sharing. Location and remote touch require separate permissions.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey)),
      ]),
    )))),
  );
}
