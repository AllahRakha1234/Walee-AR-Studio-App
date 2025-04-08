import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Share, Alert, Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';

const OpenCamera = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceLandmarks, setFaceLandmarks] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageWithLandmarks, setImageWithLandmarks] = useState(null);
  const [cameraDevice, setCameraDevice] = useState("front"); // Default to front camera
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      try {
        // Use Camera.requestCameraPermissionsAsync() instead of CameraView.requestCameraPermissionsAsync()
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        const libraryStatus = await MediaLibrary.requestPermissionsAsync();
        
        if (!cameraStatus.granted) {
          Alert.alert(
            "Camera Permission Required", 
            "This app needs camera access to detect faces. Please grant camera permission in your device settings.",
            [{ text: "OK" }]
          );
          setHasPermission(false);
          return;
        }
        
        if (!libraryStatus.granted) {
          Alert.alert(
            "Media Library Permission Required", 
            "This app needs media library access to save photos. Please grant media library permission in your device settings.",
            [{ text: "OK" }]
          );
        }
        
        setHasPermission(true);
      } catch (error) {
        console.error('Error requesting permissions:', error);
        Alert.alert("Permission Error", "Failed to request necessary permissions: " + error.message);
        setHasPermission(false);
      }
    })();
  }, []);

  // Debug log when camera device changes
  useEffect(() => {
    console.log('Camera device changed to:', cameraDevice);
  }, [cameraDevice]);

  const flipCamera = () => {
    setCameraDevice(prevDevice => {
      const newDevice = prevDevice === "front" ? "back" : "front";
      console.log(`Flipping camera from ${prevDevice} to ${newDevice}`);
      return newDevice;
    });
  };

  const onFacesDetected = (result) => {
    try {
      if (result?.faces && result.faces.length > 0) {
        // Log the detected face data with more detail
        console.log('Face detected! Data length:', JSON.stringify(result.faces).length);
        console.log('Face details:', JSON.stringify(result.faces[0], null, 2));
        
        // Make sure we have valid landmark data
        if (result.faces[0].bounds) {
          setFaceDetected(true);
          setFaceLandmarks(result.faces[0]);
        } else {
          console.log('Face detected but missing required landmark data');
          setFaceDetected(false);
        }
      } else {
        if (faceDetected) {
          console.log('Face lost - no faces in current frame');
        }
        setFaceDetected(false);
        setFaceLandmarks(null);
      }
    } catch (error) {
      console.error('Error in face detection:', error);
      setFaceDetected(false);
      setFaceLandmarks(null);
    }
  };

  const drawLandmarksOnImage = async (imageUri, landmarks) => {
    try {
      if (!landmarks) {
        console.log('No landmarks detected to draw on image');
        throw new Error('No face landmarks detected');
      }

      // Log the landmarks we'll be drawing
      console.log('Drawing landmarks on image:', JSON.stringify(landmarks, null, 2));

      // Get the image dimensions to properly scale landmarks
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [], // no actions, just get info
        { base64: false }
      );
      
      console.log('Image dimensions:', imageInfo.width, 'x', imageInfo.height);
      
      // Use ViewShot to capture the camera view with SVG overlay
      if (viewShotRef.current) {
        console.log('Using ViewShot to capture landmarks');
        try {
          const overlayUri = await viewShotRef.current.capture();
          console.log('Captured overlay:', overlayUri);
          return overlayUri; // Return the URI of the captured view with overlay
        } catch (error) {
          console.error('ViewShot capture error:', error);
        }
      }
      
      // Fallback to simple image if view shot fails
      return imageUri;
    } catch (error) {
      console.error('Error drawing landmarks:', error);
      Alert.alert("Processing Error", "Failed to draw landmarks on image: " + error.message);
      return imageUri; // Return original image if processing fails
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert("Camera Error", "Camera is not ready. Please try again.");
      return;
    }

    try {
      setProcessingImage(true);
      
      // Capture photo from camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      
      console.log('Photo Taken:', photo.uri);
      setCapturedImage(photo.uri);
      
      // Process image with landmarks if face was detected
      if (faceDetected && faceLandmarks) {
        console.log('Face landmarks available, processing image with landmarks...');
        
        try {
          // Capture the entire view with overlay using ViewShot
          if (viewShotRef.current) {
            try {
              const overlayUri = await viewShotRef.current.capture();
              console.log('ViewShot captured with landmarks:', overlayUri);
              setImageWithLandmarks(overlayUri);
              
              // Save the image with landmarks to gallery
              const asset = await MediaLibrary.createAssetAsync(overlayUri);
              console.log('Saved image with landmarks to gallery:', asset);
              
              // Add a slight delay to ensure the UI reflects the capture before showing alert
              setTimeout(() => {
                Alert.alert("Success", "Photo with facial landmarks captured and saved to gallery!");
              }, 500);
              
              setProcessingImage(false);
              return;
            } catch (viewShotError) {
              console.error('ViewShot error:', viewShotError);
              // Fall back to original approach
            }
          }
          
          // If ViewShot failed, use our original approach
          const processedImageUri = await drawLandmarksOnImage(photo.uri, faceLandmarks);
          setImageWithLandmarks(processedImageUri);
          
          // Save to device gallery
          const asset = await MediaLibrary.createAssetAsync(processedImageUri);
          console.log('Saved to gallery:', asset);
          
          // Add a slight delay before showing the alert
          setTimeout(() => {
            Alert.alert("Success", "Photo captured and saved to gallery!");
          }, 500);
        } catch (saveError) {
          console.error('Error saving to gallery:', saveError);
          Alert.alert(
            "Save Error", 
            "Failed to save photo to gallery. Please check app permissions.",
            [{ text: "OK" }]
          );
        }
      } else {
        console.log('No face landmarks detected, saving original photo');
        try {
          // Save original photo if no landmarks
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          console.log('Saved original photo to gallery:', asset);
          
          // Add a slight delay before showing the alert
          setTimeout(() => {
            Alert.alert("Success", "Photo captured and saved to gallery (no face detected)!");
          }, 500);
        } catch (saveError) {
          console.error('Error saving original photo:', saveError);
          Alert.alert(
            "Save Error", 
            "Failed to save original photo to gallery: " + saveError.message,
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        "Camera Error", 
        "Failed to take picture: " + error.message,
        [{ text: "OK" }]
      );
    } finally {
      setProcessingImage(false);
    }
  };

  const sharePhoto = async () => {
    const imageToShare = imageWithLandmarks || capturedImage;
    
    if (!imageToShare) {
      Alert.alert("Share Error", "No image available to share.");
      return;
    }
    
    try {
      await Share.share({
        url: Platform.OS === 'ios' ? imageToShare : `file://${imageToShare}`,
        message: 'Check out my photo with facial landmarks!'
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert("Share Error", "Failed to share image: " + error.message);
    }
  };

  // Render face landmarks overlay on camera view
  const renderFaceLandmarksOverlay = () => {
    if (!faceLandmarks) return null;
    
    // Get viewport dimensions for scaling
    const { bounds } = faceLandmarks;
    
    return (
      <View style={styles.landmarksOverlayContainer} pointerEvents="none">
        <Svg height="100%" width="100%" style={styles.landmarksSvg}>
          {/* Face bounding box */}
          <Rect
            x={bounds.origin.x}
            y={bounds.origin.y}
            width={bounds.size.width}
            height={bounds.size.height}
            stroke="blue"
            strokeWidth="2"
            fill="transparent"
          />
          
          {/* Eyes */}
          {faceLandmarks.leftEyePosition && (
            <Circle
              cx={faceLandmarks.leftEyePosition.x}
              cy={faceLandmarks.leftEyePosition.y}
              r="5"
              fill="blue"
            />
          )}
          
          {faceLandmarks.rightEyePosition && (
            <Circle
              cx={faceLandmarks.rightEyePosition.x}
              cy={faceLandmarks.rightEyePosition.y}
              r="5"
              fill="blue"
            />
          )}
          
          {/* Nose */}
          {faceLandmarks.noseBasePosition && (
            <Circle
              cx={faceLandmarks.noseBasePosition.x}
              cy={faceLandmarks.noseBasePosition.y}
              r="5"
              fill="green"
            />
          )}
          
          {/* Connect landmarks with lines */}
          {faceLandmarks.leftEyePosition && faceLandmarks.rightEyePosition && (
            <Line
              x1={faceLandmarks.leftEyePosition.x}
              y1={faceLandmarks.leftEyePosition.y}
              x2={faceLandmarks.rightEyePosition.x}
              y2={faceLandmarks.rightEyePosition.y}
              stroke="yellow"
              strokeWidth="2"
            />
          )}
          
          {faceLandmarks.noseBasePosition && faceLandmarks.leftEyePosition && (
            <Line
              x1={faceLandmarks.noseBasePosition.x}
              y1={faceLandmarks.noseBasePosition.y}
              x2={faceLandmarks.leftEyePosition.x}
              y2={faceLandmarks.leftEyePosition.y}
              stroke="yellow"
              strokeWidth="2"
            />
          )}
          
          {faceLandmarks.noseBasePosition && faceLandmarks.rightEyePosition && (
            <Line
              x1={faceLandmarks.noseBasePosition.x}
              y1={faceLandmarks.noseBasePosition.y}
              x2={faceLandmarks.rightEyePosition.x}
              y2={faceLandmarks.rightEyePosition.y}
              stroke="red"
              strokeWidth="2"
            />
          )}
        </Svg>
      </View>
    );
  };

  const renderFaceData = () => {
    if (!faceLandmarks) return null;

    return (
      <ScrollView style={styles.landmarkScroll}>
        <Text style={styles.landmarkText}>Face Data:</Text>
        <Text style={styles.landmarkText}>
          Bounds: {JSON.stringify(faceLandmarks.bounds, null, 2)}
        </Text>
        <Text style={styles.landmarkText}>
          Left Eye: {faceLandmarks.leftEyePosition ? JSON.stringify(faceLandmarks.leftEyePosition) : 'Not detected'}
        </Text>
        <Text style={styles.landmarkText}>
          Right Eye: {faceLandmarks.rightEyePosition ? JSON.stringify(faceLandmarks.rightEyePosition) : 'Not detected'}
        </Text>
        <Text style={styles.landmarkText}>
          Nose: {faceLandmarks.noseBasePosition ? JSON.stringify(faceLandmarks.noseBasePosition) : 'Not detected'}
        </Text>
      </ScrollView>
    );
  };

  // Handle permission status
  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission not granted</Text>
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

  if (capturedImage) {
    const displayImage = imageWithLandmarks || capturedImage;
    
    return (
      <View style={styles.container}>
        <Image 
          source={{ uri: displayImage }} 
          style={styles.capturedImage} 
        />
        <View style={styles.capturedButtonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setCapturedImage(null);
              setImageWithLandmarks(null);
            }}
          >
            <Text style={styles.buttonText}>Take Another Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={sharePhoto}
          >
            <Text style={styles.buttonText}>Share Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ViewShot 
      ref={viewShotRef} 
      options={{ quality: 1, format: 'jpg' }}
      style={styles.container}
    >
      <View style={[styles.container, faceDetected && styles.faceDetectedBackground]}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          onFacesDetected={onFacesDetected}
          faceDetectorSettings={{
            mode: 'fast', // Changed from 'accurate' to 'fast' for better performance
            detectLandmarks: 'all',
            runClassifications: 'all',
            minDetectionInterval: 50, // Reduced for more responsive detection
            tracking: true,
          }}
          // Try all these different props to see which one works for your version
          device={cameraDevice}
          type={cameraDevice} // Alternative prop name
          cameraType={cameraDevice} // Alternative prop name
          facing={cameraDevice} // Another alternative
          enableFaceDetection={true} // Make sure this is explicitly true
        >
          <View style={styles.overlay}>
            <Text style={styles.text}>
              {faceDetected ? '😊 Face Detected!' : '🔍 No Face Detected'}
            </Text>
          </View>
          
          {renderFaceLandmarksOverlay()}
          {renderFaceData()}
          
          {/* More visible camera flip button */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={flipCamera}
          >
            <Text style={styles.flipButtonText}>🔄 Flip Camera</Text>
          </TouchableOpacity>
          
          {/* Enhanced debug indicator for face detection status */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Camera: {cameraDevice}
            </Text>
            <Text style={styles.debugText}>
              Face detected: {faceDetected ? 'YES' : 'NO'}
            </Text>
            <Text style={styles.debugText}>
              Has landmarks: {faceLandmarks ? 'YES' : 'NO'}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.captureButton, processingImage && styles.disabledButton]}
              onPress={takePicture}
              disabled={processingImage}
            >
              <View style={styles.buttonInner} />
              {processingImage && <Text style={styles.processingText}>Processing...</Text>}
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  faceDetectedBackground: {
    backgroundColor: '#004d00', // Darker green for subtle indication
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 52,
    alignSelf: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonInner: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  capturedButtonsContainer: {
    position: 'absolute',
    bottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  landmarkScroll: {
    position: 'absolute',
    top: 100,
    right: 20,
    maxHeight: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  landmarkText: {
    color: 'white',
    fontSize: 10,
    marginBottom: 5,
  },
  landmarksOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  landmarksSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 2,
    bottom: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 22,
  },
  permissionText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 22,
    textAlign: 'center',
  },
  processingText: {
    position: 'absolute',
    bottom: -24,
    color: 'white',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  // Improved styles for the flip camera button
  flipButton: {
    position: 'absolute',
    top: 45,
    right: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  flipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Enhanced debug information display
  debugContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
});

export default OpenCamera;