import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { spacing } from '../utils/theme';

interface SensorStatusProps {
  pressure: number | null;
  temperature: number | null;
  gpsHeight: number | null;
  gpsAccuracy: number | null;
  isMoving: boolean;
  lux: number | null;
  magField: number | null;
  steps: number;
}

export const SensorStatus: React.FC<SensorStatusProps> = ({
  pressure,
  temperature,
  gpsHeight,
  gpsAccuracy,
  isMoving,
  lux,
  magField,
  steps,
}) => {
  const getStatusIndicator = (value: any): string => {
    return value !== null ? '🟢' : '🔴';
  };

  const calculateConfidence = () => {
    let score = 0;
    if (pressure !== null) score += 30;
    if (gpsHeight !== null && (gpsAccuracy ?? 100) < 10) score += 30;
    if (gpsHeight !== null && (gpsAccuracy ?? 100) < 30) score += 10;
    if (temperature !== null) score += 5;
    if (magField !== null) score += 10;
    if (lux !== null) score += 10;
    if (steps > 0) score += 5;
    return Math.min(score, 100);
  };

  const confidence = calculateConfidence();

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="labelLarge" style={styles.title}>
            Sensor Fusion Status
          </Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{confidence}% Confidence</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(pressure)} Precision Barometer</Text>
          <Text style={styles.value}>{pressure?.toFixed(2) ?? 'N/A'} hPa</Text>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(lux)} Ambient Light</Text>
          <Text style={styles.value}>{lux !== null ? `${lux.toFixed(0)} lx` : 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(gpsHeight)} GPS Altitude</Text>
          <Text style={styles.value}>{gpsHeight?.toFixed(2) ?? 'N/A'} m</Text>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(gpsAccuracy)} GPS Vertical Accuracy</Text>
          <Text style={styles.value}>
            {gpsAccuracy ? `±${gpsAccuracy.toFixed(1)}m` : 'N/A'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(magField)} Magnetic Intensity</Text>
          <Text style={styles.value}>{magField !== null ? `${magField.toFixed(1)} μT` : 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <Text>👟 Step Counter</Text>
          <Text style={styles.value}>{steps} steps</Text>
        </View>

        <View style={styles.row}>
          <Text>{isMoving ? '🚀' : '🅿️'} IMU Motion State</Text>
          <Text style={styles.value}>{isMoving ? 'Dynamic' : 'Stable'}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: spacing.md,
  },
  title: {
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  value: {
    fontWeight: '600',
    color: '#2196F3',
  },
});
