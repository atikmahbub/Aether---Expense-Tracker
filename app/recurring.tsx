import React from 'react';
import RecurringScreen from '@trackingPortal/screens/RecurringScreen';
import { Stack } from 'expo-router';

export default function RecurringRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <RecurringScreen />
    </>
  );
}
