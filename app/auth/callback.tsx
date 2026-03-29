import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function Callback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const code = params.code as string;

    if (!code) return;

    console.log("Auth code:", code);

    // 👉 TODO: exchange code → token (Auth0)

    // simulate async (important)
    setTimeout(() => {
      router.replace("/");
    }, 500);
  }, [params]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Logging you in...</Text>
    </View>
  );
}
