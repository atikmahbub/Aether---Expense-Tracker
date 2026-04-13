import React from 'react';

import TransactionScreen from '@trackingPortal/screens/TransactionScreen';
import {TabScreenContainer} from '@trackingPortal/components';

export default function TransactionRoute() {
  return (
    <TabScreenContainer>
      <TransactionScreen />
    </TabScreenContainer>
  );
}
