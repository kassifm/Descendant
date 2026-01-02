import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalibrationState } from '../types';

const CALIBRATION_KEY = '@verticalTracker:calibration';

export function pressureToRelativeHeight(p: number, p0: number): number {
  const ratio = p / p0;
  const h = (1 - Math.pow(ratio, 0.190284)) * 145366.45 * 0.3048;
  return h;
}

export function temperatureCorrectedHeight(
  p: number,
  p0: number,
  t: number,
  t0: number
): number {
  const baseHeight = pressureToRelativeHeight(p, p0);
  const tempFactor = (t0 + 273.15) / (t + 273.15);
  return baseHeight * tempFactor;
}

let calibration: CalibrationState | null = null;

export async function loadCalibration(): Promise<CalibrationState | null> {
  try {
    const stored = await AsyncStorage.getItem(CALIBRATION_KEY);
    if (stored) {
      calibration = JSON.parse(stored);
      return calibration;
    }
  } catch (e) {
    console.error('Failed to load calibration:', e);
  }
  return null;
}

export async function calibrateEntrance(
  currentPressure: number,
  currentTemperature: number,
  knownHeight = 0
): Promise<CalibrationState> {
  const state: CalibrationState = {
    referencePressure: currentPressure,
    referenceHeight: knownHeight,
    referenceTemperature: currentTemperature,
    timestamp: Date.now(),
  };
  calibration = state;
  await AsyncStorage.setItem(CALIBRATION_KEY, JSON.stringify(state));
  return state;
}

export function getCalibration(): CalibrationState | null {
  return calibration;
}

export function getCalibratedHeight(
  currentPressure: number,
  currentTemperature: number
): number | null {
  if (!calibration) return null;
  return (
    calibration.referenceHeight +
    temperatureCorrectedHeight(
      currentPressure,
      calibration.referencePressure,
      currentTemperature,
      calibration.referenceTemperature
    )
  );
}

export async function clearCalibration(): Promise<void> {
  calibration = null;
  await AsyncStorage.removeItem(CALIBRATION_KEY);
}
