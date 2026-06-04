import { StyleSheet, Text, View } from "react-native";

export default function StoreInfoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Informacion de la pulperia</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
});
