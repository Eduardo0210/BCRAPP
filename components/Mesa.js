import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Mesa = ({ numero, ocupada, pedidos, onPress, onCerrarCuenta }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.mesa, 
        ocupada ? styles.mesaOcupada : styles.mesaDisponible
      ]} 
      onPress={onPress}
    >
      <Text style={styles.mesaNumero}>Mesa {numero}</Text>
      {ocupada ? (
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoText}>
            {pedidos} {pedidos === 1 ? 'pedido' : 'pedidos'}
          </Text>
          <TouchableOpacity 
            style={styles.cerrarCuentaButton}
            onPress={() => onCerrarCuenta && onCerrarCuenta()}
          >
            <Text style={styles.cerrarCuentaText}>Cerrar Cuenta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.disponibleText}>Disponible</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mesa: {
    borderRadius: 10,
    padding: 20,
    margin: 10,
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    elevation: 3,
  },
  mesaDisponible: {
    backgroundColor: '#4caf50',
  },
  mesaOcupada: {
    backgroundColor: '#f44336',
  },
  mesaNumero: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pedidoInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 5,
    borderRadius: 5,
  },
  pedidoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disponibleText: {
    color: '#fff',
  },
  cerrarCuentaButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 5,
    borderRadius: 5,
  },
  cerrarCuentaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

});

export default Mesa;