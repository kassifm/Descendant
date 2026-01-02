import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, TextInput, Dialog, Portal, Text, Chip, Switch } from 'react-native-paper';
import { spacing, borderRadius } from '../utils/theme';
import {
  getLocalDeviceId,
  getConnectedDevices,
  registerDevice,
  setSyncOffset,
} from '../utils/syncOffsets';
import { deviceDiscovery, NearbyDevice } from '../utils/deviceDiscovery';

interface MultiDeviceSyncProps {
  currentHeight: number;
}

export const MultiDeviceSync: React.FC<MultiDeviceSyncProps> = ({ currentHeight }) => {
  const [visible, setVisible] = useState(false);
  const [remoteHeight, setRemoteHeight] = useState('');
  const [localDeviceId] = useState(getLocalDeviceId());
  const [connectedDevices, setConnectedDevices] = useState(getConnectedDevices());
  const [nearbyDevices, setNearbyDevices] = useState<NearbyDevice[]>([]);
  const [autoDiscovery, setAutoDiscovery] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedDevices(getConnectedDevices());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoDiscovery && visible) {
      startDiscovery();
    } else {
      stopDiscovery();
    }
    return () => stopDiscovery();
  }, [autoDiscovery, visible]);

  const startDiscovery = async () => {
    setIsScanning(true);
    await deviceDiscovery.startScanning((devices) => {
      setNearbyDevices(devices);
    });
  };

  const stopDiscovery = () => {
    setIsScanning(false);
    deviceDiscovery.stopScanning();
  };

  const handleSync = () => {
    const remote = parseFloat(remoteHeight);
    if (Number.isNaN(remote)) {
      alert('Invalid height value');
      return;
    }

    registerDevice(localDeviceId, currentHeight);
    const offset = remote - currentHeight;
    setSyncOffset(offset);

    alert(`Sync applied! Offset: ${offset.toFixed(2)}m`);
    setRemoteHeight('');
    setVisible(false);
  };

  return (
    <>
      <Button
        mode="outlined"
        onPress={() => setVisible(true)}
        style={styles.button}
      >
        Multi-Device Sync
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Synchronize Multiple Devices</Dialog.Title>

          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.content}>
                <Text variant="bodyMedium" style={styles.instruction}>
                  📱 Bring all devices together at the same location. Compare their heights
                  and enter a reference device's height to align all readings.
                </Text>

                <Card style={styles.deviceCard}>
                  <Card.Content>
                    <Text variant="labelMedium">This Device</Text>
                    <Text style={styles.deviceId}>{localDeviceId.substring(0, 8)}</Text>
                    <Text style={styles.currentHeight}>
                      Current Height: {currentHeight.toFixed(2)} m
                    </Text>
                  </Card.Content>
                </Card>

                {connectedDevices.length > 0 && (
                  <Card style={styles.connectedCard}>
                    <Card.Content>
                      <Text variant="labelMedium">Connected Devices</Text>
                      {connectedDevices.map((device) => (
                        <Chip key={device.id} style={styles.chip}>
                          {device.id.substring(0, 8)}: {device.currentHeight.toFixed(1)} m
                        </Chip>
                      ))}
                    </Card.Content>
                  </Card>
                )}

                <View style={styles.autoDiscoveryRow}>
                  <Text variant="bodyLarge">Automatic Discovery</Text>
                  <Switch
                    value={autoDiscovery}
                    onValueChange={setAutoDiscovery}
                    color="#2196F3"
                  />
                </View>

                {autoDiscovery && (
                  <View style={styles.nearbySection}>
                    <Text variant="labelMedium" style={styles.sectionTitle}>
                      {isScanning ? '🔍 Scanning for nearby devices...' : 'Nearby Devices'}
                    </Text>
                    
                    {!deviceDiscovery.isAvailable() ? (
                      <Text variant="bodySmall" style={styles.noDevicesText}>
                        Automatic discovery is not supported in Expo Go. Please use a development build to enable this feature.
                      </Text>
                    ) : nearbyDevices.length === 0 ? (
                      <Text variant="bodySmall" style={styles.noDevicesText}>
                        No nearby devices found. Make sure Bluetooth is enabled and the app is open on other devices.
                      </Text>
                    ) : (
                      nearbyDevices.map((device) => (
                        <Card key={device.id} style={styles.nearbyCard}>
                          <Card.Content style={styles.nearbyCardContent}>
                            <View>
                              <Text variant="bodyMedium">{device.name}</Text>
                              <Text variant="labelSmall">{device.id.substring(0, 8)} | RSSI: {device.rssi}</Text>
                            </View>
                            <Button 
                              mode="text" 
                              onPress={() => {
                                deviceDiscovery.connectToDevice(device.id);
                                alert(`Attempting to sync with ${device.name}...`);
                              }}
                            >
                              Sync
                            </Button>
                          </Card.Content>
                        </Card>
                      ))
                    )}
                  </View>
                )}

                <TextInput
                  label="Reference device height (m)"
                  placeholder="Enter height from reference device"
                  keyboardType="numeric"
                  value={remoteHeight}
                  onChangeText={setRemoteHeight}
                  style={styles.input}
                />

                <Text variant="bodySmall" style={styles.hint}>
                  💡 Use the height displayed on another device to synchronize.
                </Text>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button onPress={handleSync} mode="contained">
              Apply Sync
            </Button>
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
  deviceCard: {
    marginBottom: spacing.md,
    backgroundColor: '#E3F2FD',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: spacing.sm,
  },
  currentHeight: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
    color: '#2196F3',
  },
  connectedCard: {
    marginBottom: spacing.md,
    backgroundColor: '#F3E5F5',
  },
  chip: {
    marginVertical: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
  },
  hint: {
    color: '#999',
    fontStyle: 'italic',
  },
  autoDiscoveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  nearbySection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    color: '#666',
  },
  nearbyCard: {
    marginBottom: spacing.xs,
    backgroundColor: '#f9f9f9',
  },
  nearbyCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  noDevicesText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
});
