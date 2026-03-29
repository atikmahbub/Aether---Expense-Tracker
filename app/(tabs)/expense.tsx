import React from 'react';

import ExpenseScreen from '@trackingPortal/screens/ExpenseScreen';
import {TabScreenContainer} from '@trackingPortal/components';

export default function ExpenseRoute() {
  return (
    <TabScreenContainer>
      <ExpenseScreen />
    </TabScreenContainer>
  );
}
