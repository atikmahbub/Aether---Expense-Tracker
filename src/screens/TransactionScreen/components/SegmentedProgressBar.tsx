import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {colors} from '@trackingPortal/themes/colors';

export interface SegmentedProgressItem {
  id: string;
  percentage: number;
  color: string;
}

interface SegmentedProgressBarProps {
  segments: SegmentedProgressItem[];
  height?: number;
}

const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  segments,
  height = 10,
}) => {
  const normalized = useMemo(() => {
    const safeTotal = segments.reduce(
      (sum, segment) => sum + Math.max(segment.percentage, 0),
      0,
    );

    if (safeTotal === 0) {
      return [];
    }

    return segments.map(segment => ({
      ...segment,
      flex: Math.max(segment.percentage, 0),
    }));
  }, [segments]);

  if (!normalized.length) {
    return <View style={[styles.track, {height}]} />;
  }

  return (
    <View style={[styles.track, {height}]}> 
      {normalized.map(segment => (
        <View
          key={segment.id}
          style={{
            flex: segment.flex,
            backgroundColor: segment.color,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
  },
});

export default SegmentedProgressBar;
