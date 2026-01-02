import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';

const SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';
const HEIGHT_CHARACTERISTIC_UUID = '00001235-0000-1000-8000-00805f9b34fb';

export interface NearbyDevice {
  id: string;
  name: string;
  height: number;
  rssi: number;
  lastSeen: number;
}

class DeviceDiscoveryService {
  private manager: BleManager | null = null;
  private isScanning = false;
  private discoveredDevices: Map<string, NearbyDevice> = new Map();
  private onDeviceFoundCallback?: (devices: NearbyDevice[]) => void;

  constructor() {
    try {
      this.manager = new BleManager();
    } catch (e) {
      console.log('BLE Manager not available (possibly running in Expo Go)');
    }
  }

  isAvailable(): boolean {
    return this.manager !== null;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions automatically
  }

  async startScanning(onDeviceFound: (devices: NearbyDevice[]) => void) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Bluetooth permissions not granted');
      return;
    }

    if (!this.manager) {
      console.warn('BLE scanning not available');
      return;
    }

    this.onDeviceFoundCallback = onDeviceFound;
    this.isScanning = true;

    // Clear old devices
    this.discoveredDevices.clear();

    this.manager.startDeviceScan(
      [SERVICE_UUID],
      { allowDuplicates: true },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device && device.name?.includes('Descendant')) {
          this.handleDeviceFound(device);
        }
      }
    );

    // Clean up stale devices every 5 seconds
    setInterval(() => {
      this.cleanupStaleDevices();
    }, 5000);
  }

  private handleDeviceFound(device: Device) {
    const now = Date.now();
    
    // Extract height from advertisement data if available
    const height = this.extractHeightFromDevice(device);

    const nearbyDevice: NearbyDevice = {
      id: device.id,
      name: device.name || 'Unknown',
      height: height || 0,
      rssi: device.rssi || -100,
      lastSeen: now,
    };

    this.discoveredDevices.set(device.id, nearbyDevice);
    this.notifyDevicesFound();
  }

  private extractHeightFromDevice(device: Device): number | null {
    // Try to extract height from manufacturer data or service data
    // This is a simplified version - in production you'd parse the actual data
    return null;
  }

  private cleanupStaleDevices() {
    const now = Date.now();
    const staleThreshold = 10000; // 10 seconds

    for (const [id, device] of this.discoveredDevices.entries()) {
      if (now - device.lastSeen > staleThreshold) {
        this.discoveredDevices.delete(id);
      }
    }

    this.notifyDevicesFound();
  }

  private notifyDevicesFound() {
    if (this.onDeviceFoundCallback) {
      const devices = Array.from(this.discoveredDevices.values());
      this.onDeviceFoundCallback(devices);
    }
  }

  stopScanning() {
    this.isScanning = false;
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

  async connectToDevice(deviceId: string): Promise<void> {
    if (!this.manager) return;
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      
      // Read height characteristic
      const characteristic = await device.readCharacteristicForService(
        SERVICE_UUID,
        HEIGHT_CHARACTERISTIC_UUID
      );

      if (characteristic.value) {
        const height = this.decodeHeight(characteristic.value);
        const nearbyDevice = this.discoveredDevices.get(deviceId);
        if (nearbyDevice) {
          nearbyDevice.height = height;
          this.notifyDevicesFound();
        }
      }

      await device.cancelConnection();
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  private decodeHeight(base64Value: string): number {
    // Decode base64 to get height value
    const buffer = Buffer.from(base64Value, 'base64');
    return buffer.readFloatLE(0);
  }

  async startAdvertising(currentHeight: number): Promise<void> {
    // Note: BLE advertising requires native module implementation
    // This is a placeholder for the advertising logic
    console.log('Advertising height:', currentHeight);
  }

  getDiscoveredDevices(): NearbyDevice[] {
    return Array.from(this.discoveredDevices.values());
  }
}

export const deviceDiscovery = new DeviceDiscoveryService();
