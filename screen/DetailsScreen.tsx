import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRoute, useNavigation } from "@react-navigation/native"

export default function DetailsScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { itemId, title } = route.params || {}

  // In a real app, you would fetch the item details based on the itemId

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: `https://picsum.photos/id/${itemId}/400/200` }} style={styles.image} />

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Item #{itemId}</Text>

          <Text style={styles.description}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisi vel consectetur interdum, nisl
            nisi consectetur purus, eget egestas nisl nisi vel nisl. Nullam euismod, nisi vel consectetur interdum, nisl
            nisi consectetur purus, eget egestas nisl nisi vel nisl.
          </Text>

          <Text style={styles.description}>
            Nullam euismod, nisi vel consectetur interdum, nisl nisi consectetur purus, eget egestas nisl nisi vel nisl.
            Nullam euismod, nisi vel consectetur interdum, nisl nisi consectetur purus, eget egestas nisl nisi vel nisl.
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 200,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#f4511e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
})

