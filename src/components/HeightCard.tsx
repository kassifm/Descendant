import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius } from '../utils/theme';

interface HeightCardProps {
  height: number;
  velocity: number;
  accuracy?: number | null;
  isMoving?: boolean;
}

export const HeightCard: React.FC<HeightCardProps> = ({
  height,
  velocity,
  accuracy,
  isMoving,
}) => {
  const theme = useTheme();
  const [smoothedVelocity, setSmoothedVelocity] = useState(0);
  const [smoothedHeight, setSmoothedHeight] = useState(height);

  // Smooth velocity with exponential moving average
  useEffect(() => {
    setSmoothedVelocity(prev => prev * 0.7 + velocity * 0.3);
  }, [velocity]);

  // Smooth height with exponential moving average
  useEffect(() => {
    setSmoothedHeight(prev => prev * 0.8 + height * 0.2);
  }, [height]);

  const getStatusColor = () => {
    if (isMoving) return '#FF9800';
    if (smoothedVelocity < -1.0) return '#2196F3';
    if (smoothedVelocity > 1.0) return '#4CAF50';
    return '#9C27B0';
  };

  const getStatusText = () => {
    if (isMoving && Math.abs(smoothedVelocity) > 0.3) {
      return smoothedVelocity > 0 ? 'Ascending' : 'Descending';
    }
    return 'Stationary';
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.mainContent}>
            <Text style={styles.label}>Altitude</Text>
            <Text style={styles.height}>{smoothedHeight.toFixed(2)}</Text>
            <Text style={styles.unit}>meters</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Velocity</Text>
              <Text style={[styles.statValue, { color: getStatusColor() }]}>
                {smoothedVelocity.toFixed(2)} m/s
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {accuracy && (
            <View style={styles.accuracyRow}>
              <Text style={styles.accuracyText}>
                GPS Accuracy: ±{accuracy.toFixed(1)}m
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.xs,
  },
  height: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#667eea',
  },
  unit: {
    fontSize: 14,
    color: '#999',
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: '#EEE',
  },
  accuracyRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
