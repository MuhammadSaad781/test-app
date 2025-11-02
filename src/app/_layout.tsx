// app/modal/_layout.tsx (or wherever your modal layout is)
import { Stack } from 'expo-router';


export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen
        name="player"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}