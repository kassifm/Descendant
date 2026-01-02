import { Barometer } from 'expo-sensors';
import { SensorReading } from '../types';

type Subscription = {
  remove: () => void;
};

let barometerSubscription: any = null;

export async function isBarometerAvailable(): Promise<boolean> {
  return await Barometer.isAvailableAsync();
}

export async function startBarometer(intervalMs = 50): Promise<void> {
  const isAvailable = await Barometer.isAvailableAsync();
  if (!isAvailable) {
    console.warn('Barometer is not available on this device');
    return;
  }
  Barometer.setUpdateInterval(intervalMs);
}

export function stopBarometer(): Promise<void> {
  if (barometerSubscription) {
    barometerSubscription.remove();
    barometerSubscription = null;
  }
  return Promise.resolve();
}

export function addBarometerListener(
  callback: (event: SensorReading) => void
): Subscription {
  barometerSubscription = Barometer.addListener((data) => {
    callback({
      pressure: data.pressure, // hPa
      timestamp: Date.now(),
      // Barometer in expo-sensors doesn't provide temperature on all platforms
      // but we can default it or handle it in the hook
    });
  });

  return {
    remove: () => {
      if (barometerSubscription) {
        barometerSubscription.remove();
        barometerSubscription = null;
      }
    },
  };
}
