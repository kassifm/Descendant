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

/**
 * Calculates altitude using the Hypsometric Equation:
 * h = ((P0/P)^(1/5.257) - 1) * (T + 273.15) / 0.0065
 * 
 * Refined with Humidity compensation (Virtual Temperature)
 */
export function getCalibratedHeight(
  pressureHPa: number,
  tempC: number = 20,
  humidityPercent: number = 0
): number {
  if (!calibration) return 0;

  // Virtual temperature adjustment (dry air vs moist air)
  // Moist air is less dense, affecting pressure readings
  const vaporPressure = (humidityPercent / 100) * 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  const virtualTempK = (tempC + 273.15) / (1 - (vaporPressure / pressureHPa) * (1 - 0.622));

  // The Hypsometric formula
  // Assuming calibration.referencePressure is P0 (pressure at reference height)
  // and the formula calculates the height difference from that reference.
  const heightDifference = ((Math.pow(calibration.referencePressure / pressureHPa, 1 / 5.25588) - 1) * virtualTempK) / 0.0065;
  
  return calibration.referenceHeight + heightDifference;
}

export async function clearCalibration(): Promise<void> {
  calibration = null;
  await AsyncStorage.removeItem(CALIBRATION_KEY);
}
