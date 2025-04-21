// ------------ For Face Detector ------------

// import { StyleSheet, View } from "react-native";
// import FaceDetector from './screen/FaceDetector';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <FaceDetector />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });


// ------------ For Open Camera ------------

// import { useState, useEffect } from "react";
// import { Button, StyleSheet, Text, View } from "react-native";
// import { useCameraPermissions } from "expo-camera";
// import OpenCamera from './screen/OpenCamera';


// export default function App() {
//   const [permission, requestPermission] = useCameraPermissions();

//   useEffect(() => {
//     if (!permission) {
//       requestPermission();
//     }
//   }, [permission]);

//   if (!permission || !permission.granted) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.message}>We need your permission to show the camera</Text>
//         <Button onPress={requestPermission} title="Grant Permission" />
//       </View>
//     );
//   }

//   return <OpenCamera />;
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//   },
//   message: {
//     textAlign: "center",
//     paddingBottom: 10,
//   },
//   camera: {
//     flex: 1,
//   },
//   buttonContainer: {
//     flex: 1,
//     flexDirection: "row",
//     backgroundColor: "transparent",
//     margin: 64,
//   },
//   button: {
//     flex: 1,
//     alignSelf: "flex-end",
//     alignItems: "center",
//   },
//   text: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "white",
//   },
// });


// ------------ For Open Camera 1 ------------

import { useState, useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useCameraPermissions } from "expo-camera";
import OpenCamera1 from './screen/OpenCamera1';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return <OpenCamera1 />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: 'white',
  },
});



