import { Alert, Platform, ToastAndroid } from "react-native";

export function showSuccess(message: string): void {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("", message);
  }
}

export function showError(message: string): void {
  Alert.alert("", message);
}
