import React from 'react';

import SettingsScreen from '@trackingPortal/screens/SettingsScreen';
import {TabScreenContainer} from '@trackingPortal/components';

export default function SettingsRoute() {
  return (
    <TabScreenContainer>
      <SettingsScreen />
    </TabScreenContainer>
  );
}
