import * as Location from 'expo-location';
import { GPSPosition } from '../types';

export async function getCurrentPosition(): Promise<GPSPosition> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude ?? null,
    accuracy: location.coords.accuracy ?? 0,
    altitudeAccuracy: location.coords.altitudeAccuracy ?? null,
    timestamp: location.timestamp,
  };
}

let watchSubscription: Location.LocationSubscription | null = null;

export async function watchPosition(
  callback: (position: GPSPosition) => void,
  onError?: (error: any) => void
): Promise<number> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 2,
        timeInterval: 1000,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude ?? null,
          accuracy: location.coords.accuracy ?? 0,
          altitudeAccuracy: location.coords.altitudeAccuracy ?? null,
          timestamp: location.timestamp,
        });
      }
    );

    // Return a numeric ID for compatibility
    return 1;
  } catch (error) {
    onError?.(error);
    return -1;
  }
}

export function clearWatch(watchId: number): void {
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
}
