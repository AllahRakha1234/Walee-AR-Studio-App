import { StyleSheet, View } from "react-native";
import FaceDetector from './screen/FaceDetector';

export default function App() {
  return (
    <View style={styles.container}>
      <FaceDetector />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
