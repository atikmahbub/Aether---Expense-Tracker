import React from 'react';

import LoanScreen from '@trackingPortal/screens/LoanScreen';
import {TabScreenContainer} from '@trackingPortal/components';

export default function LoanRoute() {
  return (
    <TabScreenContainer>
      <LoanScreen />
    </TabScreenContainer>
  );
}
