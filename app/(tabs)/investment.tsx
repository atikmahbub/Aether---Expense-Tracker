import React from 'react';

import InvestScreen from '@trackingPortal/screens/InvestScreen';
import {TabScreenContainer} from '@trackingPortal/components';

export default function InvestmentRoute() {
  return (
    <TabScreenContainer>
      <InvestScreen />
    </TabScreenContainer>
  );
}
