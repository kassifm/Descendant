export type CalibrationState = {
  referencePressure: number;
  referenceHeight: number;
  referenceTemperature: number;
  timestamp: number;
};

export type GPSPosition = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  altitudeAccuracy: number | null;
  timestamp: number;
};

export type SensorReading = {
  pressure?: number;
  temperature?: number;
  timestamp: number;
};

export type DeviceStats = {
  id: string;
  currentHeight: number;
  lastSyncHeight: number;
  lastSyncTime: number;
  offset: number;
};

export type HistoryPoint = {
  height: number;
  gpsHeight: number | null;
  fusedHeight: number;
  velocity: number;
  timestamp: number;
  isMoving: boolean;
};

export type AlertEvent = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
  duration?: number;
};
