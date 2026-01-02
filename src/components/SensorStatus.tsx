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
}

export const SensorStatus: React.FC<SensorStatusProps> = ({
  pressure,
  temperature,
  gpsHeight,
  gpsAccuracy,
  isMoving,
}) => {
  const getStatusIndicator = (value: any): string => {
    return value !== null ? '🟢' : '🔴';
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="labelLarge" style={styles.title}>
          Sensor Status
        </Text>

        <View style={styles.row}>
          <Text>{getStatusIndicator(pressure)} Barometer</Text>
          <Text style={styles.value}>{pressure?.toFixed(2) ?? 'N/A'} hPa</Text>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(temperature)} Thermometer</Text>
          <Text style={styles.value}>{temperature?.toFixed(1) ?? 'N/A'} °C</Text>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(gpsHeight)} GPS Altitude</Text>
          <Text style={styles.value}>{gpsHeight?.toFixed(2) ?? 'N/A'} m</Text>
        </View>

        <View style={styles.row}>
          <Text>{getStatusIndicator(gpsAccuracy)} GPS Accuracy</Text>
          <Text style={styles.value}>
            {gpsAccuracy ? `±${gpsAccuracy.toFixed(1)}m` : 'N/A'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text>{isMoving ? '📍' : '🟡'} Motion</Text>
          <Text style={styles.value}>{isMoving ? 'Moving' : 'Stationary'}</Text>
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
    marginBottom: spacing.md,
    fontWeight: '600',
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
