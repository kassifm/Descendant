import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, TextInput, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { spacing, borderRadius } from '../utils/theme';
import { calibrateEntrance } from '../utils/pressureToHeight';

interface CalibrationWizardProps {
  pressure: number | null;
  temperature: number | null;
  onCalibrated?: () => void;
}

export const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
  pressure,
  temperature,
  onCalibrated,
}) => {
  const [visible, setVisible] = useState(false);
  const [knownHeight, setKnownHeight] = useState('0');
  const [step, setStep] = useState(1);
  const theme = useTheme();

  const handleCalibrate = async () => {
    if (pressure === null || temperature === null) {
      alert('Sensors not ready');
      return;
    }

    const height = parseFloat(knownHeight) || 0;
    try {
      await calibrateEntrance(pressure, temperature, height);
      setStep(3);
      setTimeout(() => {
        setVisible(false);
        setStep(1);
        onCalibrated?.();
      }, 2000);
    } catch (e) {
      alert('Calibration failed: ' + e);
    }
  };

  return (
    <>
      <Button
        mode="contained"
        onPress={() => setVisible(true)}
        style={styles.button}
      >
        Calibrate Entrance
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Entrance Calibration Wizard</Dialog.Title>

          <Dialog.ScrollArea>
            <ScrollView>
              {step === 1 && (
                <View style={styles.content}>
                  <Text variant="bodyMedium" style={styles.instruction}>
                    📍 Stand at your entrance/reference point where you know the exact elevation or want to set it as ground level (0 meters).
                  </Text>

                  <Card style={styles.infoCard}>
                    <Card.Content>
                      <Text variant="labelMedium" style={styles.sensorLabel}>Current Sensors</Text>
                      <Text style={styles.sensorValue}>
                        Pressure: {pressure?.toFixed(2) ?? 'N/A'} hPa
                      </Text>
                      <Text style={styles.sensorValue}>
                        Temperature: {temperature?.toFixed(1) ?? 'N/A'} °C
                      </Text>
                    </Card.Content>
                  </Card>

                  <TextInput
                    label="Known height (meters)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={knownHeight}
                    onChangeText={setKnownHeight}
                    style={styles.input}
                  />

                  <Text variant="bodySmall" style={styles.hint}>
                    💡 Use 0 for ground level, or enter the actual elevation if known from maps.
                  </Text>
                </View>
              )}

              {step === 2 && (
                <View style={styles.content}>
                  <Text variant="bodyMedium" style={styles.instruction}>
                    Calibrating with sensors and temperature compensation...
                  </Text>
                </View>
              )}

              {step === 3 && (
                <View style={styles.content}>
                  <Text
                    variant="titleMedium"
                    style={[styles.instruction, { color: theme.colors.primary }]}
                  >
                    ✓ Calibration Complete!
                  </Text>
                  <Text variant="bodySmall" style={styles.hint}>
                    Your entrance is now set as reference. Height changes will be measured relative to this point.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            {step === 1 && (
              <>
                <Button onPress={() => setVisible(false)}>Cancel</Button>
                <Button
                  onPress={() => {
                    setStep(2);
                    setTimeout(() => handleCalibrate(), 500);
                  }}
                  mode="contained"
                >
                  Next
                </Button>
              </>
            )}
            {step === 3 && <Button onPress={() => setVisible(false)}>Done</Button>}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    margin: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  instruction: {
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  infoCard: {
    marginBottom: spacing.md,
    backgroundColor: '#F5F5F5',
  },
  sensorLabel: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sensorValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
  },
  hint: {
    color: '#999',
    fontStyle: 'italic',
  },
});
