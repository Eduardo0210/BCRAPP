// screens/SeleccionarImpresoraScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';

const SeleccionarImpresoraScreen = ({ navigation, route }) => {
  const [impresoras, setImpresoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const { resumen, metodoPago } = route.params;

  useEffect(() => {
    const buscarDispositivos = async () => {
      try {
        const isEnabled = await BluetoothManager.isBluetoothEnabled();
        if (!isEnabled) await BluetoothManager.enableBluetooth();

        const bonded = await BluetoothManager.getBondedDevices();
        setImpresoras(bonded);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron obtener los dispositivos Bluetooth');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    buscarDispositivos();
  }, []);

  const seleccionar = (impresora) => {
    navigation.navigate('ResumenTicket', {
      resumen,
      metodoPago,
      impresora
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una impresora</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#f8b500" />
      ) : (
        <FlatList
          data={impresoras}
          keyExtractor={(item) => item.address}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => seleccionar(item)}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.noDevices}>No se encontraron impresoras emparejadas.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '600' },
  address: { fontSize: 12, color: '#666' },
  noDevices: { textAlign: 'center', marginTop: 20, color: '#888' },
});

export default SeleccionarImpresoraScreen;
