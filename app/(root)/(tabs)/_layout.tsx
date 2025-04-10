import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View, Platform } from "react-native";

import { icons } from "@/constants";

const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => (
  <View
    className={`flex justify-center items-center ${focused ? "" : ""}`}
    style={{
      borderRadius: 24,
      padding: 0,
      margin: 0,
      backgroundColor: focused ? "rgba(2, 134, 255, 0.2)" : "transparent",
    }}
  >
    <View
      className={`rounded-full w-11 h-11 items-center justify-center`}
      style={{
        padding: 0,
        margin: 0,
        backgroundColor: focused ? "#0286FF" : "transparent",
      }}
    >
      <Image
        source={source}
        tintColor="white"
        resizeMode="contain"
        className="w-6 h-6"
      />
    </View>
  </View>
);

export default function Layout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#888888",
          borderRadius: 50,
          paddingVertical: 0,
          paddingHorizontal: 0,
          overflow: "hidden",
          marginHorizontal: 20,
          marginBottom: 10,
          height: 65,
          display: "flex",
          flexDirection: "row",
          position: "absolute",
          ...Platform.select({
            android: {
              elevation: 8,
            },
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
          }),
        },
        tabBarItemStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 65,
          margin: 0,
          padding: 0,
          position: "relative",
          top: 12,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon source={icons.home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "Rides",
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon source={icons.list} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon source={icons.profile} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
