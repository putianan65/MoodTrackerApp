import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import ActivityLogScreen from '../screens/ActivityLogScreen';
import ColorMeaningScreen from '../screens/ColorMeaningScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import MoodPickerScreen from '../screens/MoodPickerScreen';
import SummaryScreen from '../screens/SummaryScreen';
import WeeklyScreen from '../screens/WeeklyScreen';
import { colors } from '../theme';
import { transitions } from './transitions';
import type { RootStackParamList } from './types';

// JS stack (not native-stack) so the custom transitions also run on the web
// build and in in-editor device previews.
const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        // On web the JS stack otherwise lets pages grow past the viewport
        // (min-height: 100%) for document scrolling; screens scroll themselves.
        headerMode: 'float',
        cardStyle: { backgroundColor: colors.paper },
        ...transitions.slide,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="MoodPicker"
        component={MoodPickerScreen}
        options={({ route }) => (route.params.period === 'night' ? transitions.nightfall : transitions.rise)}
      />
      <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
      <Stack.Screen name="Summary" component={SummaryScreen} options={transitions.rise} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Weekly" component={WeeklyScreen} />
      <Stack.Screen name="ColorMeaning" component={ColorMeaningScreen} />
    </Stack.Navigator>
  );
}
