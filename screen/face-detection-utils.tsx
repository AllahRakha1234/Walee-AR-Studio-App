// Add this utility file to help with face detection debugging

export const analyzeFaceDetectionResult = (result) => {
    if (!result || !result.faces) {
      return {
        detected: false,
        message: "No face data received!",
        details: null,
      }
    }
  
    if (result.faces.length === 0) {
      return {
        detected: false,
        message: "No faces detected in frame!",
        details: null,
      }
    }
  
    const face = result.faces[0]
    const hasRequiredLandmarks = face.bounds && face.leftEyePosition && face.rightEyePosition && face.noseBasePosition
  
    return {
      detected: true,
      complete: hasRequiredLandmarks,
      message: hasRequiredLandmarks
        ? "Face with complete landmarks detected"
        : "Face detected but missing some landmarks",
      details: {
        hasBounds: !!face.bounds,
        hasLeftEye: !!face.leftEyePosition,
        hasRightEye: !!face.rightEyePosition,
        hasNose: !!face.noseBasePosition,
        faceID: face.faceID,
        rollAngle: face.rollAngle,
        yawAngle: face.yawAngle,
      },
      rawData: face,
    }
  }
  
  export const logFaceDetectionData = (result) => {
    const analysis = analyzeFaceDetectionResult(result)
  
    console.log("Face Detection Analysis:", JSON.stringify(analysis, null, 2))
  
    if (analysis.detected && analysis.details) {
      // Log specific landmark coordinates if available
      if (analysis.rawData.leftEyePosition) {
        console.log("Left Eye Position:", analysis.rawData.leftEyePosition)
      }
      if (analysis.rawData.rightEyePosition) {
        console.log("Right Eye Position:", analysis.rawData.rightEyePosition)
      }
      if (analysis.rawData.noseBasePosition) {
        console.log("Nose Position:", analysis.rawData.noseBasePosition)
      }
      if (analysis.rawData.bounds) {
        console.log("Face Bounds:", analysis.rawData.bounds)
      }
    }
  
    return analysis
  }
  
  