import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Share, Alert, Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';
import * as FaceDetector from 'expo-face-detector';

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
  const [imageDimensions, setImageDimensions] = useState(null);

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

  useEffect(() => {
    console.log('Camera initialized with face detection settings:', {
      mode: 'accurate',
      detectLandmarks: 'all',
      runClassifications: 'all',
      minDetectionInterval: 100,
      tracking: true
    });
  }, []);

  const flipCamera = () => {
    setCameraDevice(prevDevice => {
      const newDevice = prevDevice === "front" ? "back" : "front";
      console.log(`Flipping camera from ${prevDevice} to ${newDevice}`);
      return newDevice;
    });
  };

  const onFacesDetected = (result) => {
    try {
      console.log('Face Detection Raw Result:', {
        hasResult: !!result,
        resultType: typeof result,
        facesCount: result?.faces?.length || 0,
        rawData: result
      });
      
      if (result?.faces && result.faces.length > 0) {
        const face = result.faces[0];
        console.log('Face Detection Details:', {
          hasBounds: !!face.bounds,
          boundsType: typeof face.bounds,
          boundsData: face.bounds,
          hasLeftEye: !!face.leftEyePosition,
          hasRightEye: !!face.rightEyePosition,
          hasNose: !!face.noseBasePosition,
          leftEye: face.leftEyePosition,
          rightEye: face.rightEyePosition,
          nose: face.noseBasePosition
        });
        
        if (face.bounds) {
          setFaceDetected(true);
          setFaceLandmarks(face);
          console.log('Face Landmarks Set:', face);
        } else {
          console.log('Face detected but missing bounds data');
          setFaceDetected(false);
        }
      } else {
        console.log('No faces detected in current frame');
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

      // Create a temporary image with landmarks
      const tempImagePath = `${FileSystem.cacheDirectory}landmarks.png`;
      
      // Create a canvas-like drawing using ImageManipulator
      const actions = [
        {
          type: 'resize',
          width: imageInfo.width,
          height: imageInfo.height,
        }
      ];

      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('Processed image with landmarks:', processedImage.uri);
      return processedImage.uri;
    } catch (error) {
      console.error('Error drawing landmarks:', error);
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
      console.log('Taking Picture - Starting face detection process...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      
      console.log('Photo Captured:', photo.uri);
      setCapturedImage(photo.uri);
      
      // Process the image to detect faces
      const options = {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
        runClassifications: FaceDetector.FaceDetectorClassifications.all,
        minDetectionInterval: 0,
        tracking: false,
      };

      console.log('Processing image for face detection with options:', options);
      const result = await FaceDetector.detectFacesAsync(photo.uri, options);
      console.log('Face Detection Result:', {
        facesDetected: result.faces.length,
        firstFace: result.faces[0],
        allData: result
      });

      if (result.faces && result.faces.length > 0) {
        const face = result.faces[0];
        console.log('Face Landmarks Data:', {
          bounds: face.bounds,
          leftEye: face.LEFT_EYE,
          rightEye: face.RIGHT_EYE,
          nose: face.NOSE_BASE,
          leftMouth: face.LEFT_MOUTH,
          rightMouth: face.RIGHT_MOUTH,
          bottomMouth: face.BOTTOM_MOUTH,
          leftCheek: face.LEFT_CHEEK,
          rightCheek: face.RIGHT_CHEEK,
          leftEar: face.LEFT_EAR,
          rightEar: face.RIGHT_EAR,
          rollAngle: face.rollAngle,
          yawAngle: face.yawAngle
        });
        
        setFaceDetected(true);
        setFaceLandmarks(face);
        
        try {
          // First save the original photo
          await MediaLibrary.createAssetAsync(photo.uri);
          
          // Then capture and save the photo with landmarks
          if (viewShotRef.current) {
            console.log('Attempting to capture view with landmarks...');
            const processedUri = await viewShotRef.current.capture();
            console.log('ViewShot captured with landmarks:', processedUri);
            
            const asset = await MediaLibrary.createAssetAsync(processedUri);
            console.log('Saved image with landmarks to gallery:', asset);
            
            setImageWithLandmarks(processedUri);
            Alert.alert("Success", "Photo with facial landmarks saved to gallery!");
          }
        } catch (error) {
          console.error('Error processing image with landmarks:', error);
          Alert.alert("Note", "Photo saved but couldn't add landmarks overlay.");
        }
      } else {
        console.log('No faces detected in the captured image');
        setFaceDetected(false);
        setFaceLandmarks(null);
        // Save original photo if no faces detected
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        console.log('Saved original photo to gallery:', asset);
        Alert.alert("Note", "Photo saved but no faces were detected.");
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert("Camera Error", "Failed to take picture: " + error.message);
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
    if (!faceLandmarks) {
      console.log('No landmarks available to render');
      return null;
    }
    
    console.log('Rendering mesh overlay with landmarks:', faceLandmarks);
    
    return (
      <View style={styles.landmarksOverlayContainer} pointerEvents="none">
        <Svg height="100%" width="100%" style={styles.landmarksSvg}>
          {/* Face mesh - connecting landmarks with lines */}
          {/* Forehead to eyes */}
          {faceLandmarks.LEFT_EYE && faceLandmarks.RIGHT_EYE && (
            <>
              {/* Eye connection */}
              <Line
                x1={faceLandmarks.LEFT_EYE.x}
                y1={faceLandmarks.LEFT_EYE.y - 30}
                x2={faceLandmarks.RIGHT_EYE.x}
                y2={faceLandmarks.RIGHT_EYE.y - 30}
                stroke="white"
                strokeWidth="2"
              />
              {/* Vertical lines above eyes */}
              <Line
                x1={faceLandmarks.LEFT_EYE.x}
                y1={faceLandmarks.LEFT_EYE.y - 30}
                x2={faceLandmarks.LEFT_EYE.x}
                y2={faceLandmarks.LEFT_EYE.y}
                stroke="white"
                strokeWidth="2"
              />
              <Line
                x1={faceLandmarks.RIGHT_EYE.x}
                y1={faceLandmarks.RIGHT_EYE.y - 30}
                x2={faceLandmarks.RIGHT_EYE.x}
                y2={faceLandmarks.RIGHT_EYE.y}
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}

          {/* Eyes to nose */}
          {faceLandmarks.LEFT_EYE && faceLandmarks.RIGHT_EYE && faceLandmarks.NOSE_BASE && (
            <>
              <Line
                x1={faceLandmarks.LEFT_EYE.x}
                y1={faceLandmarks.LEFT_EYE.y}
                x2={faceLandmarks.NOSE_BASE.x}
                y2={faceLandmarks.NOSE_BASE.y}
                stroke="white"
                strokeWidth="2"
              />
              <Line
                x1={faceLandmarks.RIGHT_EYE.x}
                y1={faceLandmarks.RIGHT_EYE.y}
                x2={faceLandmarks.NOSE_BASE.x}
                y2={faceLandmarks.NOSE_BASE.y}
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}

          {/* Eyes to cheeks */}
          {faceLandmarks.LEFT_EYE && faceLandmarks.LEFT_CHEEK && (
            <Line
              x1={faceLandmarks.LEFT_EYE.x}
              y1={faceLandmarks.LEFT_EYE.y}
              x2={faceLandmarks.LEFT_CHEEK.x}
              y2={faceLandmarks.LEFT_CHEEK.y}
              stroke="white"
              strokeWidth="2"
            />
          )}
          {faceLandmarks.RIGHT_EYE && faceLandmarks.RIGHT_CHEEK && (
            <Line
              x1={faceLandmarks.RIGHT_EYE.x}
              y1={faceLandmarks.RIGHT_EYE.y}
              x2={faceLandmarks.RIGHT_CHEEK.x}
              y2={faceLandmarks.RIGHT_CHEEK.y}
              stroke="white"
              strokeWidth="2"
            />
          )}

          {/* Nose to mouth */}
          {faceLandmarks.NOSE_BASE && faceLandmarks.LEFT_MOUTH && faceLandmarks.RIGHT_MOUTH && (
            <>
              <Line
                x1={faceLandmarks.NOSE_BASE.x}
                y1={faceLandmarks.NOSE_BASE.y}
                x2={faceLandmarks.LEFT_MOUTH.x}
                y2={faceLandmarks.LEFT_MOUTH.y}
                stroke="white"
                strokeWidth="2"
              />
              <Line
                x1={faceLandmarks.NOSE_BASE.x}
                y1={faceLandmarks.NOSE_BASE.y}
                x2={faceLandmarks.RIGHT_MOUTH.x}
                y2={faceLandmarks.RIGHT_MOUTH.y}
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}

          {/* Mouth connections */}
          {faceLandmarks.LEFT_MOUTH && faceLandmarks.RIGHT_MOUTH && faceLandmarks.BOTTOM_MOUTH && (
            <>
              <Line
                x1={faceLandmarks.LEFT_MOUTH.x}
                y1={faceLandmarks.LEFT_MOUTH.y}
                x2={faceLandmarks.RIGHT_MOUTH.x}
                y2={faceLandmarks.RIGHT_MOUTH.y}
                stroke="white"
                strokeWidth="2"
              />
              <Line
                x1={faceLandmarks.LEFT_MOUTH.x}
                y1={faceLandmarks.LEFT_MOUTH.y}
                x2={faceLandmarks.BOTTOM_MOUTH.x}
                y2={faceLandmarks.BOTTOM_MOUTH.y}
                stroke="white"
                strokeWidth="2"
              />
              <Line
                x1={faceLandmarks.RIGHT_MOUTH.x}
                y1={faceLandmarks.RIGHT_MOUTH.y}
                x2={faceLandmarks.BOTTOM_MOUTH.x}
                y2={faceLandmarks.BOTTOM_MOUTH.y}
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}

          {/* Cheeks to jaw */}
          {faceLandmarks.LEFT_CHEEK && faceLandmarks.LEFT_MOUTH && (
            <Line
              x1={faceLandmarks.LEFT_CHEEK.x}
              y1={faceLandmarks.LEFT_CHEEK.y}
              x2={faceLandmarks.LEFT_MOUTH.x}
              y2={faceLandmarks.LEFT_MOUTH.y}
              stroke="white"
              strokeWidth="2"
            />
          )}
          {faceLandmarks.RIGHT_CHEEK && faceLandmarks.RIGHT_MOUTH && (
            <Line
              x1={faceLandmarks.RIGHT_CHEEK.x}
              y1={faceLandmarks.RIGHT_CHEEK.y}
              x2={faceLandmarks.RIGHT_MOUTH.x}
              y2={faceLandmarks.RIGHT_MOUTH.y}
              stroke="white"
              strokeWidth="2"
            />
          )}

          {/* Additional mesh lines for more detail */}
          {faceLandmarks.LEFT_EYE && faceLandmarks.RIGHT_EYE && (
            <Line
              x1={faceLandmarks.LEFT_EYE.x}
              y1={faceLandmarks.LEFT_EYE.y}
              x2={faceLandmarks.RIGHT_EYE.x}
              y2={faceLandmarks.RIGHT_EYE.y}
              stroke="white"
              strokeWidth="2"
            />
          )}

          {/* Small dots at landmark points for reference */}
          {Object.entries(faceLandmarks).map(([key, value]) => {
            if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
              return (
                <Circle
                  key={key}
                  cx={value.x}
                  cy={value.y}
                  r="3"
                  fill="white"
                />
              );
            }
            return null;
          })}
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
        <Text style={styles.permissionText}>Camera permission is not granted</Text>
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
    return (
      <ViewShot 
        ref={viewShotRef}
        options={{ format: "jpg", quality: 1 }}
        style={styles.container}
      >
        <View style={styles.container}>
          <Image 
            source={{ uri: capturedImage }} 
            style={styles.capturedImage}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              console.log('Image layout dimensions:', { width, height });
              // Store these dimensions for scaling
              setImageDimensions({ width, height });
            }}
          />
          {faceLandmarks && (
            <View style={[styles.landmarksOverlayContainer, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
              <Svg height="100%" width="100%" style={styles.landmarksSvg}>
                {/* Scale coordinates helper function */}
                {(() => {
                  if (!imageDimensions) return null;
                  
                  // Get original image dimensions from face detection
                  const originalWidth = 3072; // From your logs
                  const originalHeight = 4096;
                  
                  // Calculate scale factors
                  const scaleX = imageDimensions.width / originalWidth;
                  const scaleY = imageDimensions.height / originalHeight;
                  
                  // Helper function to scale coordinates
                  const scalePoint = (point) => ({
                    x: point.x * scaleX,
                    y: point.y * scaleY
                  });

                  // Helper function to interpolate between two points
                  const interpolatePoints = (p1, p2, ratio) => ({
                    x: p1.x + (p2.x - p1.x) * ratio,
                    y: p1.y + (p2.y - p1.y) * ratio
                  });

                  console.log('Scaling factors:', { scaleX, scaleY });
                  
                  return (
                    <>
                      {/* Create a more detailed face mesh */}
                      {(() => {
                        if (!faceLandmarks.LEFT_EYE || !faceLandmarks.RIGHT_EYE || 
                            !faceLandmarks.NOSE_BASE || !faceLandmarks.LEFT_MOUTH || 
                            !faceLandmarks.RIGHT_MOUTH || !faceLandmarks.BOTTOM_MOUTH) {
                          return null;
                        }

                        // Scale all base points
                        const leftEye = scalePoint(faceLandmarks.LEFT_EYE);
                        const rightEye = scalePoint(faceLandmarks.RIGHT_EYE);
                        const nose = scalePoint(faceLandmarks.NOSE_BASE);
                        const leftMouth = scalePoint(faceLandmarks.LEFT_MOUTH);
                        const rightMouth = scalePoint(faceLandmarks.RIGHT_MOUTH);
                        const bottomMouth = scalePoint(faceLandmarks.BOTTOM_MOUTH);
                        const leftCheek = faceLandmarks.LEFT_CHEEK ? scalePoint(faceLandmarks.LEFT_CHEEK) : null;
                        const rightCheek = faceLandmarks.RIGHT_CHEEK ? scalePoint(faceLandmarks.RIGHT_CHEEK) : null;

                        // Calculate additional mesh points
                        const foreheadCenter = {
                          x: (leftEye.x + rightEye.x) / 2,
                          y: leftEye.y - (rightEye.x - leftEye.x) * 0.5
                        };

                        const leftTemple = {
                          x: leftEye.x - (rightEye.x - leftEye.x) * 0.3,
                          y: leftEye.y
                        };

                        const rightTemple = {
                          x: rightEye.x + (rightEye.x - leftEye.x) * 0.3,
                          y: rightEye.y
                        };

                        // Generate mesh points
                        const meshPoints = [];
                        const meshLines = [];

                        // Add forehead points
                        for (let i = 0; i <= 4; i++) {
                          const ratio = i / 4;
                          meshPoints.push(interpolatePoints(leftTemple, rightTemple, ratio));
                        }

                        // Add eye region points
                        const leftEyebrowOuter = { x: leftEye.x - 20 * scaleX, y: leftEye.y - 15 * scaleY };
                        const leftEyebrowInner = { x: leftEye.x + 20 * scaleX, y: leftEye.y - 15 * scaleY };
                        const rightEyebrowInner = { x: rightEye.x - 20 * scaleX, y: rightEye.y - 15 * scaleY };
                        const rightEyebrowOuter = { x: rightEye.x + 20 * scaleX, y: rightEye.y - 15 * scaleY };

                        meshPoints.push(leftEyebrowOuter, leftEyebrowInner, rightEyebrowInner, rightEyebrowOuter);

                        // Add cheek points
                        const leftCheekPoints = [];
                        const rightCheekPoints = [];
                        for (let i = 0; i <= 2; i++) {
                          const ratio = i / 2;
                          leftCheekPoints.push(interpolatePoints(leftEye, leftMouth, ratio));
                          rightCheekPoints.push(interpolatePoints(rightEye, rightMouth, ratio));
                        }

                        // Generate mesh lines
                        const addLine = (p1, p2) => {
                          meshLines.push(
                            <Line
                              key={`${Math.round(p1.x)}_${Math.round(p1.y)}_${Math.round(p2.x)}_${Math.round(p2.y)}_${meshLines.length}`}
                              x1={p1.x}
                              y1={p1.y}
                              x2={p2.x}
                              y2={p2.y}
                              stroke="white"
                              strokeWidth="1"
                              opacity="0.7"
                            />
                          );
                        };

                        // Connect forehead mesh
                        for (let i = 0; i < meshPoints.length - 1; i++) {
                          addLine(meshPoints[i], meshPoints[i + 1]);
                        }

                        // Connect eyebrows to eyes
                        addLine(leftEyebrowOuter, leftEye);
                        addLine(leftEyebrowInner, leftEye);
                        addLine(rightEyebrowInner, rightEye);
                        addLine(rightEyebrowOuter, rightEye);

                        // Connect eyes to nose
                        addLine(leftEye, nose);
                        addLine(rightEye, nose);

                        // Connect nose to mouth
                        addLine(nose, leftMouth);
                        addLine(nose, rightMouth);
                        addLine(nose, bottomMouth);

                        // Connect mouth points
                        addLine(leftMouth, rightMouth);
                        addLine(leftMouth, bottomMouth);
                        addLine(rightMouth, bottomMouth);

                        // Connect cheek mesh
                        leftCheekPoints.forEach((point, idx) => {
                          if (idx < leftCheekPoints.length - 1) {
                            addLine(point, leftCheekPoints[idx + 1]);
                          }
                          // Add unique identifier for left cheek connections
                          meshLines.push(
                            <Line
                              key={`leftCheek_${idx}_${Math.round(point.x)}_${Math.round(point.y)}`}
                              x1={point.x}
                              y1={point.y}
                              x2={nose.x}
                              y2={nose.y}
                              stroke="white"
                              strokeWidth="1"
                              opacity="0.7"
                            />
                          );
                        });

                        rightCheekPoints.forEach((point, idx) => {
                          if (idx < rightCheekPoints.length - 1) {
                            addLine(point, rightCheekPoints[idx + 1]);
                          }
                          // Add unique identifier for right cheek connections
                          meshLines.push(
                            <Line
                              key={`rightCheek_${idx}_${Math.round(point.x)}_${Math.round(point.y)}`}
                              x1={point.x}
                              y1={point.y}
                              x2={nose.x}
                              y2={nose.y}
                              stroke="white"
                              strokeWidth="1"
                              opacity="0.7"
                            />
                          );
                        });

                        return (
                          <>
                            {meshLines}
                            {/* Render points */}
                            {[...meshPoints, ...leftCheekPoints, ...rightCheekPoints].map((point, index) => (
                              <Circle
                                key={`point_${index}_${Math.round(point.x)}_${Math.round(point.y)}`}
                                cx={point.x}
                                cy={point.y}
                                r="2"
                                fill="white"
                                opacity="0.7"
                              />
                            ))}
                            {/* Main landmark points */}
                            <Circle cx={leftEye.x} cy={leftEye.y} r="3" fill="white" />
                            <Circle cx={rightEye.x} cy={rightEye.y} r="3" fill="white" />
                            <Circle cx={nose.x} cy={nose.y} r="3" fill="white" />
                            <Circle cx={leftMouth.x} cy={leftMouth.y} r="3" fill="white" />
                            <Circle cx={rightMouth.x} cy={rightMouth.y} r="3" fill="white" />
                            <Circle cx={bottomMouth.x} cy={bottomMouth.y} r="3" fill="white" />
                          </>
                        );
                      })()}
                    </>
                  );
                })()}
              </Svg>
            </View>
          )}
          <View style={styles.capturedButtonsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                if (viewShotRef.current && faceLandmarks) {
                  try {
                    console.log('Attempting to capture view with landmarks...');
                    const uri = await viewShotRef.current.capture();
                    console.log('Captured image with mesh:', uri);
                    const asset = await MediaLibrary.createAssetAsync(uri);
                    console.log('Saved image with mesh to gallery:', asset);
                    Alert.alert("Success", "Image with face mesh saved to gallery!");
                  } catch (error) {
                    console.error('Error saving image with mesh:', error);
                  }
                }
                setCapturedImage(null);
                setImageWithLandmarks(null);
                setFaceLandmarks(null);
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
      </ViewShot>
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
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
            runClassifications: FaceDetector.FaceDetectorClassifications.all,
            minDetectionInterval: 0,
            tracking: false,
          }}
          type={cameraDevice}
          enableFaceDetection={true}
          onMountError={(error) => {
            console.error('Camera mount error:', error);
          }}
          onCameraReady={() => {
            console.log('Camera is ready for face detection');
          }}
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
            <Text style={styles.flipButtonText}>Flip Camera 🔄</Text>
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
    top: 50,
    left: 4,
    right: 4,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonInner: {
    width: 50,
    height: 50,
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
    bottom: 26,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  landmarkScroll: {
    position: 'absolute',
    top: 100,
    right: 20,
    maxHeight: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 14,
    borderRadius: 12,
  },
  landmarkText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 6,
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
    top: 6,
    left: 6,
    right: 4,
    bottom: 4,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 16,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  processingText: {
    position: 'absolute',
    bottom: -24,
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
  },
  // Improved styles for the flip camera button
  flipButton: {
    position: 'absolute',
    top: 40,
    right: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 18,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  flipButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'semibold',
  },
  // Enhanced debug information display
  debugContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 18,
    borderRadius: 6,
  },
  debugText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
});

export default OpenCamera;