import { StyleSheet, View } from "react-native";
import FaceDetectorScreen from './screen/FaceDetector';

export default function App() {
  return (
    <View style={styles.container}>
      <FaceDetectorScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
