import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceStats } from '../types';

const SYNC_KEY = '@verticalTracker:syncOffset';
const DEVICES_KEY = '@verticalTracker:devices';

let syncOffset = 0;
let localDeviceId = Math.random().toString(36).substr(2, 9);
let devices: Map<string, DeviceStats> = new Map();

export async function loadSyncState() {
  try {
    const stored = await AsyncStorage.getItem(SYNC_KEY);
    if (stored) syncOffset = parseFloat(stored);

    const devicesStored = await AsyncStorage.getItem(DEVICES_KEY);
    if (devicesStored) {
      const parsed = JSON.parse(devicesStored);
      devices = new Map(parsed);
    }
  } catch (e) {
    console.error('Failed to load sync state:', e);
  }
}

export function setSyncOffset(offset: number) {
  syncOffset = offset;
  AsyncStorage.setItem(SYNC_KEY, offset.toString());
}

export function getSyncOffset(): number {
  return syncOffset;
}

export function applySyncOffset(height: number): number {
  return height + syncOffset;
}

export function getLocalDeviceId(): string {
  return localDeviceId;
}

export function registerDevice(
  deviceId: string,
  currentHeight: number
): DeviceStats {
  const stat: DeviceStats = {
    id: deviceId,
    currentHeight,
    lastSyncHeight: currentHeight,
    lastSyncTime: Date.now(),
    offset: 0,
  };
  devices.set(deviceId, stat);
  AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(Array.from(devices.entries())));
  return stat;
}

export function updateDeviceHeight(deviceId: string, height: number) {
  const stat = devices.get(deviceId);
  if (stat) {
    stat.currentHeight = height;
    devices.set(deviceId, stat);
  }
}

export function getConnectedDevices(): DeviceStats[] {
  const now = Date.now();
  return Array.from(devices.values()).filter((d) => now - d.lastSyncTime < 60000);
}

export function computeGroupSync(): number {
  const connected = getConnectedDevices();
  if (connected.length === 0) return 0;
  const avg = connected.reduce((sum, d) => sum + d.currentHeight, 0) / connected.length;
  return avg;
}
