import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class WebRTCController {
  RTCPeerConnection? _peerConnection;
  RTCDataChannel? _dataChannel;
  MediaStream? _localStream;

  static const MethodChannel _nativeChannel = MethodChannel('com.ghosttouch/native');

  Future<void> initializeConnection() async {
    final Map<String, dynamic> configuration = {
      'iceServers': [
        {'url': 'stun:stun.l.google.com:19302'},
      ]
    };

    _peerConnection = await createPeerConnection(configuration);

    _peerConnection?.onIceCandidate = (candidate) {
      // Send candidate to signaling server
    };

    _peerConnection?.onDataChannel = (channel) {
      _dataChannel = channel;
      _dataChannel?.onMessage = _handleDataChannelMessage;
    };
  }

  Future<void> startScreenCapture() async {
    final Map<String, dynamic> mediaConstraints = {
      'audio': false,
      'video': {
        'mandatory': {
          'minWidth': '720',
          'minHeight': '1280',
          'minFrameRate': '30',
        },
        'facingMode': 'user',
      }
    };

    try {
      _localStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);
      _localStream?.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, _localStream!);
      });
    } catch (e) {
      print("Screen capture failed: $e");
    }
  }

  void _handleDataChannelMessage(RTCDataChannelMessage message) {
    if (!message.isBinary) {
      try {
        final payload = jsonDecode(message.text);
        if (payload['type'] == 'TOUCH_EVENT') {
          // Pass coordinate to native Kotlin AccessibilityService
          _nativeChannel.invokeMethod('injectTouch', {
            'action': payload['action'],
            'x': payload['x'],
            'y': payload['y'],
          });
        }
      } catch (e) {
        print("Invalid message payload: $e");
      }
    }
  }

  void dispose() {
    _localStream?.dispose();
    _dataChannel?.close();
    _peerConnection?.close();
  }
}
