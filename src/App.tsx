import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaperProvider, Text, ActivityIndicator, Button } from 'react-native-paper';
import { lightTheme, darkTheme, spacing } from './utils/theme';
import { useVerticalTracking } from './hooks/useVerticalTracking';
import { getCalibration } from './utils/pressureToHeight';
import { applySyncOffset } from './utils/syncOffsets';
import { HeightCard } from './components/HeightCard';
import { CalibrationWizard } from './components/CalibrationWizard';
import { MultiDeviceSync } from './components/MultiDeviceSync';
import { SensorStatus } from './components/SensorStatus';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);

  const { height, velocity, pressure, temperature, gpsHeight, gpsAccuracy, isMoving, history } =
    useVerticalTracking();

  useEffect(() => {
    const cal = getCalibration();
    setIsCalibrated(cal !== null);
  }, []);

  const displayHeight = applySyncOffset(height);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              📍 Descendant
            </Text>
            <Button
              onPress={() => setIsDarkMode(!isDarkMode)}
              style={styles.themeButton}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </Button>
          </View>

          {/* Calibration Check */}
          {!isCalibrated && (
            <View style={[styles.warningCard, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.warningText}>
                ⚠️ Please calibrate at your entrance first!
              </Text>
            </View>
          )}

          {/* Main Height Card */}
          <HeightCard
            height={displayHeight}
            velocity={velocity}
            accuracy={gpsAccuracy}
            isMoving={isMoving}
          />

          {/* Sensor History Summary */}
          <View style={styles.historyCard}>
            <Text variant="labelLarge">Session Summary</Text>
            <Text style={styles.historyText}>
              Readings: {history.length} | Max: {Math.max(...history.map((h) => h.height), 0).toFixed(2)} m
            </Text>
            <Text style={styles.historyText}>
              Min: {Math.min(...history.map((h) => h.height), 0).toFixed(2)} m
            </Text>
          </View>

          {/* Calibration Section */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Setup & Calibration
            </Text>
            {pressure !== null && temperature !== null ? (
              <CalibrationWizard
                pressure={pressure}
                temperature={temperature}
                onCalibrated={() => setIsCalibrated(true)}
              />
            ) : (
              <View style={styles.loadingCard}>
                <ActivityIndicator animating size="large" />
                <Text>Initializing sensors...</Text>
              </View>
            )}
          </View>

          {/* Multi-Device Sync */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Multi-Device
            </Text>
            <MultiDeviceSync currentHeight={displayHeight} />
          </View>

          {/* Sensor Status */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Live Sensors
            </Text>
            <SensorStatus
              pressure={pressure}
              temperature={temperature}
              gpsHeight={gpsHeight}
              gpsAccuracy={gpsAccuracy}
              isMoving={isMoving}
            />
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              🔄 Real-time fusion of barometer, GPS, accelerometer & temperature
            </Text>
            <Text variant="bodySmall" style={styles.footerText}>
              ⚡ Accuracy improves with calibration & multi-device sync
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontWeight: '700',
  },
  themeButton: {
    margin: 0,
  },
  warningCard: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  warningText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  historyCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  historyText: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  loadingCard: {
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  footer: {
    marginHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  footerText: {
    color: '#999',
    marginBottom: spacing.xs,
  },
});

export default App;
