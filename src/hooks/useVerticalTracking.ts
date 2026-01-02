import { useEffect, useRef, useState } from 'react';
import { DeviceMotion, LightSensor, Magnetometer, Pedometer } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/DeviceSensor';
import { Platform } from 'react-native';

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
  const [lux, setLux] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [magField, setMagField] = useState<number | null>(null);
  const [steps, setSteps] = useState(0);
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

    let motionSub: Subscription | null = null;
    let lightSub: Subscription | null = null;
    let magSub: Subscription | null = null;
    let pedoSub: { remove: () => void } | null = null;
    let baroSub: { remove: () => void } | null = null;

    const startRealSensors = async () => {
      try {
        const available = await isBarometerAvailable();
        if (!available) {
          console.warn('Barometer not available, using mock mode');
          startMockSensors();
          return;
        }

        DeviceMotion.setUpdateInterval(50);
        LightSensor.setUpdateInterval(500);
        Magnetometer.setUpdateInterval(500);

        await startBarometer(50);

        // Check and start Pedometer
        const pedoAvailable = await Pedometer.isAvailableAsync();
        if (pedoAvailable) {
          pedoSub = Pedometer.watchStepCount((result) => {
            setSteps(result.steps);
          });
        }

        magSub = Magnetometer.addListener((data) => {
          const strength = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
          setMagField(strength);
        });

        baroSub = addBarometerListener((event: SensorReading) => {
          if (event.pressure) setPressure(event.pressure);
          if (event.temperature) setTemperature(event.temperature);

          const calibration = getCalibration();
          const temp = temperature ?? 20;
          const baroHeight =
            calibration && (event.pressure ?? pressure)
              ? getCalibratedHeight(event.pressure ?? pressure ?? 0, temp, humidity ?? 0)
              : null;

          if (!baroHeight || !lastAccelRef.current) return;

          const ts = event.timestamp;

          kalmanRef.current.update({
            baroHeight,
            gpsHeight: gpsHeight ?? undefined,
            linearAccelZ: lastAccelRef.current.z,
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

        motionSub = DeviceMotion.addListener((data) => {
          if (data.acceleration) {
            const event = { 
              x: data.acceleration.x, 
              y: data.acceleration.y, 
              z: data.acceleration.z, 
              timestamp: Date.now() 
            };
            lastAccelRef.current = event;
            motionRef.current.addReading(event.x, event.y, event.z, event.timestamp);
            setIsMoving(motionRef.current.isMoving());
          }
        });

        lightSub = LightSensor.addListener((data) => {
          setLux(data.illuminance);
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

      if (gpsHeightRef.current != null) {
         mockHeight = gpsHeightRef.current;
      }
      
      mockIntervalRef.current = setInterval(() => {
        const delta = (Math.random() - 0.5) * 0.1;
        mockHeight += delta;
        mockPressure -= delta * 0.12;

        setHeight(mockHeight);
        setPressure(mockPressure);
        setTemperature(20 + Math.random() * 0.5);
        setVelocity(delta * 20);
        setLux(Math.random() * 500);
        setMagField(30 + Math.random() * 10);
        setSteps((s) => s + (Math.random() > 0.9 ? 1 : 0));
        
        setIsMoving(Math.abs(delta) > 0.02);

        const ts = Date.now();
        setHistory((prev) => [
          ...prev.slice(-299),
          {
            height: mockHeight,
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
       motionSub?.remove();
       lightSub?.remove();
       magSub?.remove();
       pedoSub?.remove();
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

  return { height, velocity, pressure, temperature, gpsHeight, gpsAccuracy, isMoving, history, lux, humidity, magField, steps };
}
