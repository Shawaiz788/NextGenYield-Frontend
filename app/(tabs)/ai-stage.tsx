import { Redirect } from 'expo-router';
import React from 'react';

/**
 * Legacy AI Stage route redirected to consolidated Scan screen
 */
export default function AiStageRedirectScreen() {
  return <Redirect href="/(tabs)/scan" />;
}
