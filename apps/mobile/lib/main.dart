import 'package:flutter/material.dart';
import 'dart:math';

void main() {
  runApp(const GhostTouchApp());
}

class GhostTouchApp extends StatelessWidget {
  const GhostTouchApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'GhostTouch',
      theme: ThemeData.dark().copyWith(
        primaryColor: Colors.blueAccent,
        scaffoldBackgroundColor: const Color(0xFF0F1115),
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String sessionPin = "------";
  bool isConnected = false;

  @override
  void initState() {
    super.initState();
    _generatePin();
  }

  void _generatePin() {
    final rand = Random();
    final pin = List.generate(6, (_) => rand.nextInt(10)).join();
    setState(() {
      sessionPin = pin;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GhostTouch Device'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.important_devices, size: 80, color: Colors.blueAccent),
            const SizedBox(height: 30),
            const Text(
              'Your Session PIN',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
            const SizedBox(height: 10),
            Text(
              sessionPin,
              style: const TextStyle(
                fontSize: 48,
                letterSpacing: 8.0,
                fontWeight: FontWeight.bold,
                fontFamily: 'monospace'
              ),
            ),
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: isConnected ? Colors.green.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isConnected ? Colors.green : Colors.orange,
                )
              ),
              child: Text(
                isConnected ? 'CONNECTED' : 'WAITING FOR DASHBOARD...',
                style: TextStyle(
                  color: isConnected ? Colors.green : Colors.orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
