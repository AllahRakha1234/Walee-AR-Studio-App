import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

const RealTimeFaceDetection = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceData, setFaceData] = useState(null);
  const [detectionLogs, setDetectionLogs] = useState([]);
  const cameraRef = useRef(null);

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      try {
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission status:', cameraStatus);
        
        if (!cameraStatus.granted) {
          Alert.alert(
            "Camera Permission Required", 
            "This app needs camera access to detect faces. Please grant camera permission in your device settings.",
            [{ text: "OK" }]
          );
          setHasPermission(false);
          return;
        }
        
        setHasPermission(true);
        console.log('Camera permission granted, initializing face detection...');
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        Alert.alert("Permission Error", "Failed to request camera permission: " + error.message);
        setHasPermission(false);
      }
    })();
  }, []);

  const addDetectionLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    setDetectionLogs(prevLogs => [logEntry, ...prevLogs].slice(0, 10)); // Keep last 10 logs
    console.log(logEntry);
  };

  const handleFacesDetected = ({ faces }) => {
    try {
      console.log('Raw face detection data:', JSON.stringify(faces, null, 2));
      
      if (faces && faces.length > 0) {
        const face = faces[0];
        console.log('First face details:', JSON.stringify(face, null, 2));
        
        // Log detailed face data
        const faceInfo = {
          faceID: face.faceID,
          bounds: face.bounds,
          rollAngle: face.rollAngle,
          yawAngle: face.yawAngle,
          smilingProbability: face.smilingProbability,
          leftEyeOpenProbability: face.leftEyeOpenProbability,
          rightEyeOpenProbability: face.rightEyeOpenProbability,
          // Add facial landmarks for visualization
          leftEye: face.leftEyePosition,
          rightEye: face.rightEyePosition,
          nose: face.noseBasePosition,
          leftMouth: face.leftMouthPosition,
          rightMouth: face.rightMouthPosition,
          bottomMouth: face.bottomMouthPosition
        };

        console.log('Processed face info:', JSON.stringify(faceInfo, null, 2));
        setFaceData(faceInfo);
        
        if (!faceDetected) {
          addDetectionLog('Face detected! Starting real-time tracking...');
          addDetectionLog(`Face Data: ${JSON.stringify(faceInfo, null, 2)}`);
        }
        
        setFaceDetected(true);
      } else {
        console.log('No faces detected in current frame');
        if (faceDetected) {
          addDetectionLog('Face lost from view');
          setFaceDetected(false);
          setFaceData(null);
        }
      }
    } catch (error) {
      console.error('Error in face detection handler:', error);
      addDetectionLog(`Error: ${error.message}`);
    }
  };

  const renderFaceOverlay = () => {
    if (!faceData) {
      console.log('No face data available for overlay');
      return null;
    }
    
    console.log('Rendering face overlay with data:', faceData);
    
    return (
      <View style={styles.overlayContainer} pointerEvents="none">
        <Svg height="100%" width="100%" style={styles.overlaySvg}>
          {/* Face bounds rectangle */}
          <Rect
            x={faceData.bounds.origin.x}
            y={faceData.bounds.origin.y}
            width={faceData.bounds.size.width}
            height={faceData.bounds.size.height}
            stroke="white"
            strokeWidth="2"
            fill="none"
          />

          {/* Facial landmarks */}
          {faceData.leftEye && (
            <Circle
              cx={faceData.leftEye.x}
              cy={faceData.leftEye.y}
              r="5"
              fill="white"
            />
          )}
          {faceData.rightEye && (
            <Circle
              cx={faceData.rightEye.x}
              cy={faceData.rightEye.y}
              r="5"
              fill="white"
            />
          )}
          {faceData.nose && (
            <Circle
              cx={faceData.nose.x}
              cy={faceData.nose.y}
              r="5"
              fill="white"
            />
          )}
          {faceData.leftMouth && faceData.rightMouth && (
            <Line
              x1={faceData.leftMouth.x}
              y1={faceData.leftMouth.y}
              x2={faceData.rightMouth.x}
              y2={faceData.rightMouth.y}
              stroke="white"
              strokeWidth="2"
            />
          )}
          {faceData.bottomMouth && faceData.leftMouth && (
            <Line
              x1={faceData.leftMouth.x}
              y1={faceData.leftMouth.y}
              x2={faceData.bottomMouth.x}
              y2={faceData.bottomMouth.y}
              stroke="white"
              strokeWidth="2"
            />
          )}
          {faceData.bottomMouth && faceData.rightMouth && (
            <Line
              x1={faceData.rightMouth.x}
              y1={faceData.rightMouth.y}
              x2={faceData.bottomMouth.x}
              y2={faceData.bottomMouth.y}
              stroke="white"
              strokeWidth="2"
            />
          )}
        </Svg>
      </View>
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Alert.alert(
            "Permission Required", 
            "Please grant camera permission in your device settings to use this feature.",
            [{ text: "OK" }]
          )}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 0,
          tracking: true,
        }}
        onCameraReady={() => {
          console.log('Camera is ready for face detection');
          addDetectionLog('Camera initialized and ready for face detection');
        }}
        onMountError={(error) => {
          console.error('Camera mount error:', error);
          addDetectionLog(`Camera mount error: ${error.message}`);
        }}
      >
        {renderFaceOverlay()}
        
        <View style={styles.faceDetectionStatus}>
          <Text style={styles.statusText}>
            {faceDetected ? '😊 Face Detected' : '🔍 No Face'}
          </Text>
        </View>

        <View style={styles.logsContainer}>
          {detectionLogs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </View>

        {faceData && (
          <View style={styles.faceDataContainer}>
            <Text style={styles.faceDataText}>
              Roll: {faceData.rollAngle.toFixed(2)}°
            </Text>
            <Text style={styles.faceDataText}>
              Yaw: {faceData.yawAngle.toFixed(2)}°
            </Text>
            <Text style={styles.faceDataText}>
              Smile: {(faceData.smilingProbability * 100).toFixed(0)}%
            </Text>
            <Text style={styles.faceDataText}>
              Left Eye: {(faceData.leftEyeOpenProbability * 100).toFixed(0)}%
            </Text>
            <Text style={styles.faceDataText}>
              Right Eye: {(faceData.rightEyeOpenProbability * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlaySvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  faceDetectionStatus: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
  },
  logsContainer: {
    position: 'absolute',
    bottom: 102,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    maxHeight: 150,
  },
  logText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  faceDataContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  faceDataText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 8,
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 44,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default RealTimeFaceDetection;