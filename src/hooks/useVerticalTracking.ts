import { useEffect, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/DeviceSensor';

import {
  startBarometer,
  stopBarometer,
  addBarometerListener,
  isBarometerAvailable,
} from '../utils/barometer';
import {
  getCalibration,
  getCalibratedHeight,
  loadCalibration,
} from '../utils/pressureToHeight';
import { VerticalKalmanFilter } from '../utils/verticalKalman';
import { HistoryPoint, SensorReading } from '../types';
import { MotionDetector } from '../utils/motionDetector';
import { watchPosition, clearWatch } from '../utils/gps';

type AccelEvent = {
  x: number;
  y: number;
  z: number;
  timestamp?: number;
};

export function useVerticalTracking() {
  const [height, setHeight] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [pressure, setPressure] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [gpsHeight, setGpsHeight] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  const kalmanRef = useRef(new VerticalKalmanFilter());
  const motionRef = useRef(new MotionDetector());
  const lastAccelRef = useRef<AccelEvent | null>(null);
  const lastGyroRef = useRef<any>(null);
  const gpsWatchIdRef = useRef<number | null>(null);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsHeightRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      await loadCalibration();
    })();

    let accelSub: Subscription | null = null;
    let gyroSub: Subscription | null = null;
    let baroSub: { remove: () => void } | null = null;

    const startRealSensors = async () => {
      try {
        const available = await isBarometerAvailable();
        if (!available) {
          console.warn('Barometer not available, using mock mode');
          startMockSensors();
          return;
        }

        Accelerometer.setUpdateInterval(50);
        Gyroscope.setUpdateInterval(50);

        await startBarometer(50);

        baroSub = addBarometerListener((event: SensorReading) => {
          if (event.pressure) setPressure(event.pressure);
          if (event.temperature) setTemperature(event.temperature);

          const calibration = getCalibration();
          const temp = temperature ?? 20;
          const baroHeight =
            calibration && pressure
              ? getCalibratedHeight(event.pressure ?? pressure, temp)
              : null;

          const accel = lastAccelRef.current;
          if (!baroHeight || !accel) return;

          const verticalAccel = accel.z - 9.81;

          const ts = accel.timestamp ?? event.timestamp;

          kalmanRef.current.update({
            baroHeight,
            gpsHeight: gpsHeight ?? undefined,
            linearAccelZ: verticalAccel,
            timestamp: ts,
          });

          const newHeight = kalmanRef.current.getAltitude();
          const newVelocity = kalmanRef.current.getVerticalVelocity();

          setHeight(newHeight);
          setVelocity(newVelocity);

          setHistory((prev) => [
            ...prev.slice(-299),
            {
              height: newHeight,
              gpsHeight,
              fusedHeight: newHeight,
              velocity: newVelocity,
              timestamp: ts,
              isMoving: motionRef.current.isMoving(),
            },
          ]);
        });

        accelSub = Accelerometer.addListener((accel) => {
          const event = { x: accel.x, y: accel.y, z: accel.z, timestamp: Date.now() };
          lastAccelRef.current = event;
          motionRef.current.addReading(event.x, event.y, event.z, event.timestamp);
          setIsMoving(motionRef.current.isMoving());
        });

        gyroSub = Gyroscope.addListener((gyro) => {
          lastGyroRef.current = gyro;
        });

      } catch (e) {
        console.warn('Failed to initialize sensors, using mock data', e);
        startMockSensors();
      }
    };

    const startMockSensors = () => {
      if (mockIntervalRef.current) return;
      console.log('Starting mock sensors...');
      
      let mockHeight = 10;
      let mockPressure = 1013.25;

      // Initialize mock height from real GPS if available, to avoid jump
      if (gpsHeightRef.current != null) {
         mockHeight = gpsHeightRef.current;
      }
      
      mockIntervalRef.current = setInterval(() => {
        // Simulate very gradual, smooth movement
        const delta = (Math.random() - 0.5) * 0.1; // Reduced from 0.5 to 0.1
        mockHeight += delta;
        mockPressure -= delta * 0.12; // Approximation

        setHeight(mockHeight);
        setPressure(mockPressure);
        setTemperature(20 + Math.random() * 0.5); // Reduced temperature variation
        setVelocity(delta * 20); // 50ms interval ~ 20Hz
        
        setIsMoving(Math.abs(delta) > 0.02); // Reduced threshold

        const ts = Date.now();
        setHistory((prev) => [
          ...prev.slice(-299),
          {
            height: mockHeight,
            // Use real GPS if available, otherwise mock with less variation
            gpsHeight: gpsHeightRef.current ?? (mockHeight + (Math.random() - 0.5) * 2),
            fusedHeight: mockHeight,
            velocity: delta * 20,
            timestamp: ts,
            isMoving: Math.abs(delta) > 0.02,
          },
        ]);
      }, 50);
    };

    const cleanup = () => {
       accelSub?.remove();
       gyroSub?.remove();
       baroSub?.remove();
       stopBarometer().catch(() => {});
       if (gpsWatchIdRef.current) clearWatch(gpsWatchIdRef.current);
    };

    // Attempt start
    startRealSensors();

    watchPosition(
      (position) => {
        setGpsHeight(position.altitude ?? null);
        gpsHeightRef.current = position.altitude ?? null;
        setGpsAccuracy(position.altitudeAccuracy ?? position.accuracy);
      },
      () => {}
    ).then(id => {
      gpsWatchIdRef.current = id;
    });

    return () => {
      cleanup();
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
    };
  }, []);

  return { height, velocity, pressure, temperature, gpsHeight, gpsAccuracy, isMoving, history };
}
