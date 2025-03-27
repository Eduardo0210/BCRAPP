import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { getMesas, obtenerPedido, procesarPago } from '../api/services';

const ResumenScreen = ({ navigation }) => {
  const [mesas, setMesas] = useState([]);
  const [mesasConPedidos, setMesasConPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMesa, setExpandedMesa] = useState(null);
  const [expandedPedido, setExpandedPedido] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Cargar datos de todas las mesas
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las mesas
      const mesasData = await getMesas();
      setMesas(mesasData);
      
      // Filtrar mesas con pedidos activos
      const mesasActivas = mesasData.filter(mesa => mesa.pedidosActivos > 0);
      setMesasConPedidos(mesasActivas);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudieron cargar los datos. Por favor, verifica tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos al inicio
  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para refrescar los datos
  const handleRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  // Procesar el pago de un pedido
  const cerrarCuenta = (mesaId, pedidoId, total) => {
    Alert.alert(
      'Cerrar Cuenta',
      `¿Cómo deseas procesar el pago de $${total.toFixed(2)}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Efectivo',
          onPress: () => procesarPagoFinal(mesaId, pedidoId, total, 'Efectivo')
        },
        {
          text: 'Tarjeta',
          onPress: () => procesarPagoFinal(mesaId, pedidoId, total, 'Tarjeta')
        }
      ]
    );
  };
  
  // Procesar el pago y actualizar la UI
  const procesarPagoFinal = async (mesaId, pedidoId, total, metodoPago) => {
    try {
      setProcessingPayment(true);
      
      // Datos para el pago
      const pagoData = {
        monto: total,
        metodoPago: metodoPago,
        numeroReferencia: metodoPago === 'Tarjeta' ? `REF${Date.now()}` : null
      };
      
      // Procesar el pago en la API
      await procesarPago(pedidoId, pagoData);
      
      // Actualizar la UI
      Alert.alert(
        'Pago Completado',
        'El pago se ha procesado correctamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Actualizar la lista de mesas con pedidos
              cargarDatos();
              // Colapsar las secciones expandidas
              setExpandedMesa(null);
              setExpandedPedido(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      Alert.alert(
        'Error',
        'No se pudo procesar el pago. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Cargar detalles de un pedido
  const cargarDetallePedido = async (pedidoId) => {
    try {
      return await obtenerPedido(pedidoId);
    } catch (error) {
      console.error(`Error al cargar detalle del pedido ${pedidoId}:`, error);
      return null;
    }
  };

  // Renderizar cada mesa con sus pedidos
  const renderMesa = ({ item }) => (
    <View style={styles.mesaContainer}>
      <TouchableOpacity 
        style={styles.mesaHeader}
        onPress={() => setExpandedMesa(expandedMesa === item.id ? null : item.id)}
      >
        <View style={styles.mesaInfo}>
          <Text style={styles.mesaTitle}>
            {item.numero === 'Para llevar' ? 'Pedido para llevar' : `Mesa ${item.numero}`}
          </Text>
          <Text style={styles.mesaSubtitle}>
            {item.pedidosActivos} {item.pedidosActivos === 1 ? 'pedido' : 'pedidos'} activos
          </Text>
        </View>
        <Text style={styles.mesaExpandIcon}>
          {expandedMesa === item.id ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      
      {expandedMesa === item.id && (
        <View style={styles.pedidosContainer}>
          <Text style={styles.loadingText}>
            Toca una mesa para ver sus pedidos activos. Cuando estén listos, podrás procesarlos.
          </Text>
        </View>
      )}
    </View>
  );

  // Mostrar indicador de carga mientras se obtienen los datos
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#f8b500" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Resumen de Pedidos</Text>
      
      {mesasConPedidos.length > 0 ? (
        <FlatList
          data={mesasConPedidos}
          renderItem={renderMesa}
          keyExtractor={item => item.id.toString()}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay pedidos activos</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={cargarDatos}
          >
            <Text style={styles.refreshButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
    color: '#f8b500'
  },
  mesaContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
  },
  mesaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
  },
  mesaInfo: {
    flex: 1,
  },
  mesaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8b500',
  },
  mesaSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mesaExpandIcon: {
    fontSize: 16,
    color: '#666',
  },
  pedidosContainer: {
    padding: 10,
  },
  pedidoContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  pedidoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pedidoInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  totalPedido: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pedidoDetalles: {
    padding: 10,
    backgroundColor: '#fff',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemCantidad: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  itemInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  itemNombre: {
    fontSize: 14,
  },
  itemNotas: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  itemPrecio: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'right',
  },
  pedidoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  pedidoButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  cerrarButton: {
    backgroundColor: '#e74c3c',
    marginRight: 5,
  },
  editarButton: {
    backgroundColor: '#3498db',
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#f8b500',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ResumenScreen;