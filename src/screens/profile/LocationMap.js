import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LocationService from '../../services/LocationService';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const LocationMap = ({ route, navigation }) => {
  // Get params from navigation
  const { latitude, longitude, title } = route.params || {};
  
  // Refs
  const mapRef = useRef(null);
  
  // States
  const [region, setRegion] = useState({
    latitude: latitude || 10.762622,  // Default to a location in Vietnam if none provided
    longitude: longitude || 106.660172,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [markerCoords, setMarkerCoords] = useState({
    latitude: latitude || 10.762622,
    longitude: longitude || 106.660172,
  });
  const [mapReady, setMapReady] = useState(false);
  
  // Check if we have actual coordinates
  const hasCoordinates = !!latitude && !!longitude;
  
  // If we don't have coordinates, try to get current location
  useEffect(() => {
    if (!hasCoordinates) {
      getCurrentLocation();
    }
  }, []);
  
  // Get current location if not provided
  const getCurrentLocation = async () => {
    try {
      const status = await LocationService.requestLocationPermission();
      
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí bị từ chối',
          'Vui lòng cấp quyền truy cập vị trí để xem vị trí hiện tại của bạn.'
        );
        return;
      }
      
      const location = await LocationService.getCurrentLocation();
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      setRegion(newRegion);
      setMarkerCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (mapReady && mapRef.current) {
        mapRef.current.animateToRegion(newRegion);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Lỗi vị trí',
        'Không thể lấy vị trí hiện tại. Vui lòng thử lại sau.'
      );
    }
  };
  
  // Handle map ready
  const onMapReady = () => {
    setMapReady(true);
  };
  
  // Center the map on the marker
  const centerMap = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...markerCoords,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };
  
  // Zoom in
  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      });
    }
  };
  
  // Zoom out
  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      });
    }
  };
  
  // Handle region change
  const onRegionChange = (newRegion) => {
    setRegion(newRegion);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Vị trí'}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={onRegionChange}
          onMapReady={onMapReady}
        >
          <Marker
            coordinate={markerCoords}
            title={title || 'Vị trí của tôi'}
            description={`${markerCoords.latitude.toFixed(6)}, ${markerCoords.longitude.toFixed(6)}`}
          />
        </MapView>
        
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlButton} onPress={zoomIn}>
            <Ionicons name="add" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mapControlButton} onPress={zoomOut}>
            <Ionicons name="remove" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mapControlButton} onPress={centerMap}>
            <MaterialIcons name="my-location" size={22} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mapControlButton} onPress={getCurrentLocation}>
            <MaterialIcons name="gps-fixed" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesTitle}>Tọa độ:</Text>
          <Text style={styles.coordinatesText}>
            {markerCoords.latitude.toFixed(6)}, {markerCoords.longitude.toFixed(6)}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={() => {
            Alert.alert(
              'Chia sẻ vị trí',
              'Bạn có muốn chia sẻ vị trí này với bạn bè?',
              [
                {
                  text: 'Hủy',
                  style: 'cancel'
                },
                {
                  text: 'Chia sẻ',
                  onPress: () => {
                    // Here you would implement the sharing functionality
                    Alert.alert('Đã chia sẻ', 'Vị trí đã được chia sẻ thành công!');
                  }
                }
              ]
            );
          }}
        >
          <MaterialIcons name="share" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Chia sẻ vị trí</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapControlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginVertical: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  coordinatesContainer: {
    marginBottom: 12,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 16,
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default LocationMap; 