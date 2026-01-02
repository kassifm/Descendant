// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker } from 'react-native-maps';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    return (
      granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted' &&
      granted['android.permission.ACCESS_COARSE_LOCATION'] === 'granted'
    );
  } else {
    const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    return result === RESULTS.GRANTED;
  }
};

export default function App() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    async function init() {
      const permission = await requestLocationPermission();
      if (!permission) {
        console.log('Location permission denied');
        return;
      }
      Geolocation.watchPosition(
        position => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || 0,
          });
        },
        error => console.log(error),
        { enableHighAccuracy: true, distanceFilter: 1, interval: 1000 }
      );
    }
    init();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: location?.latitude || 37.78825,
          longitude: location?.longitude || -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={`Altitude: ${location.altitude.toFixed(2)} m`}
          />
        )}
      </MapView>
      <View style={{ padding: 10 }}>
        <Text>Latitude: {location?.latitude}</Text>
        <Text>Longitude: {location?.longitude}</Text>
        <Text>Altitude: {location?.altitude?.toFixed(2)} m</Text>
      </View>
    </View>
  );
}
