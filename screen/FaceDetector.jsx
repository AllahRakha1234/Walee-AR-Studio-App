import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import * as FaceDetector from 'expo-face-detector';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const FaceDetectorScreen = () => {
  const [faceLandmarks, setFaceLandmarks] = useState(null);
  const [processing, setProcessing] = useState(false);
  const viewShotRef = React.useRef(null);
  
  // Reference the image
  const imageSourcePath = require('./assets/img.jpg');

  useEffect(() => {
    prepareAndDetectFace();
  }, []);

  const prepareAndDetectFace = async () => {
    try {
      setProcessing(true);

      // First, get the image URI using Image.resolveAssetSource
      const resolvedAsset = Image.resolveAssetSource(imageSourcePath);
      console.log('Resolved assets:', resolvedAsset);

      // Create a temporary file path
      const tempDirectory = FileSystem.cacheDirectory;
      const tempFilePath = `${tempDirectory}temp_image.jpg`;

      // Download the image to the temporary location
      await FileSystem.downloadAsync(
        resolvedAsset.uri,
        tempFilePath
      );

      console.log('Processing image at paht:', tempFilePath);

      // Process the image to detect faces
      const options = {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
        runClassifications: FaceDetector.FaceDetectorClassifications.all,
        minDetectionInterval: 0,
        tracking: false,
      };

      const result = await FaceDetector.detectFacesAsync(tempFilePath, options);

      if (result.faces && result.faces.length > 0) {
        console.log('Detected face in image:', result.faces[0]);
        setFaceLandmarks(result.faces[0]);
        
        // Capture the view with landmarks if available
        if (viewShotRef.current) {
          const processedUri = await viewShotRef.current.capture();
          saveToGallery(processedUri);
        }
      } else {
        Alert.alert("No Face Detected", "Could not detect any faces in this image");
      }

      // Clean up the temporary file
      await FileSystem.deleteAsync(tempFilePath, { idempotent: true });

    } catch (error) {
      console.error('Face detection error:', error);
      Alert.alert("Error", "Failed to process image: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const saveToGallery = async (uri) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const asset = await MediaLibrary.createAssetAsync(uri);
        Alert.alert("Success", "Image with facial landmarks saved to gallery!");
      } else {
        Alert.alert("Permission Required", "Need permission to save to gallery");
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert("Save Error", "Failed to save image to gallery");
    }
  };

  const renderFaceLandmarksOverlay = () => {
    if (!faceLandmarks) return null;
    
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
            stroke="yellow"
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
              stroke="yellow"
              strokeWidth="2"
            />
          )}
        </Svg>
      </View>
    );
  };

  return (
    <ViewShot 
      ref={viewShotRef}
      options={{ quality: 1, format: 'jpg' }}
      style={styles.container}
    >
      <View style={styles.container}>
        <Image 
          source={imageSourcePath}
          style={styles.image}
          resizeMode="contain"
        />
        {renderFaceLandmarksOverlay()}
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {processing ? 'Processing...' : faceLandmarks ? 'Face Detected!' : 'No Face Detected'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, processing && styles.disabledButton]}
          onPress={prepareAndDetectFace}
          disabled={processing}
        >
          <Text style={styles.buttonText}>
            {processing ? 'Processing...' : 'Detect Face Again'}
          </Text>
        </TouchableOpacity>
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
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
    right: 0,
    bottom: 0,
  },
  statusContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  }
});

export default FaceDetectorScreen; 