import React from 'react';
import CategoryScreen from '@trackingPortal/screens/CategoryScreen/CategoryScreen';
import { Stack } from 'expo-router';

export default function CategoriesRoute() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }} 
      />
      <CategoryScreen />
    </>
  );
}
