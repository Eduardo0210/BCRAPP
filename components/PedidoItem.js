import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PedidoItem = ({ item, cantidad, notas, onDelete, onEdit }) => {
  return (
    <TouchableOpacity style={styles.item} onPress={onEdit}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNombre}>{item.nombre}</Text>
        {notas && <Text style={styles.tipoCarne}>Carne: {notas}</Text>}
        <Text style={styles.itemPrecio}>${(item.precio * cantidad).toFixed(2)}</Text>
      </View>
      <View style={styles.cantidadContainer}>
        <Text style={styles.cantidad}>x{cantidad}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>X</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipoCarne: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrecio: {
    color: '#888',
  },
  cantidadContainer: {
    backgroundColor: '#ddd',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  cantidad: {
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PedidoItem;