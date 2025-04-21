import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

const App = () => (
  <Camera
    // other props
    onFacesDetected={handleFacesDetected}
    faceDetectorSettings={{
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
      runClassifications: FaceDetector.FaceDetectorClassifications.none,
      minDetectionInterval: 100,
      tracking: true,
    }}
  />
);

const handleFacesDetected = ({ faces }) => {
  console.log(faces);
};

export default App;
