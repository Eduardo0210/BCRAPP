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
import { obtenerPedidosPorMesa } from '../api/services/pedidosService';

const ResumenScreen = ({ navigation }) => {
  const [mesas, setMesas] = useState([]);
  const [mesasConPedidos, setMesasConPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMesa, setExpandedMesa] = useState(null);
  const [expandedPedido, setExpandedPedido] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pedidosDetalles, setPedidosDetalles] = useState({});
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [cargandoPedidosMesa, setCargandoPedidosMesa] = useState({});

  // Cargar datos de todas las mesas
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las mesas
      const mesasData = await getMesas();
      setMesas(mesasData);
      
      // Filtrar mesas con pedidos activos
      const mesasActivas = mesasData.filter(mesa => mesa.pedidosActivos > 0);
      
      // Inicializar las mesas activas sin cargar todos los pedidos todavía
      // Esto acelera la carga inicial mostrando primero las mesas
      setMesasConPedidos(mesasActivas.map(mesa => ({
        ...mesa,
        pedidos: []
      })));
      
      // Limpiar los detalles de pedidos almacenados cuando se refresca
      setPedidosDetalles({});
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

  // Cargar pedidos de una mesa específica cuando se expande
  const cargarPedidosDeMesa = async (mesaId) => {
    try {
      // Marcar que estamos cargando los pedidos de esta mesa
      setCargandoPedidosMesa(prev => ({
        ...prev,
        [mesaId]: true
      }));
      
      console.log(`Cargando pedidos para la mesa ${mesaId}`);
      
      // Obtener los pedidos de la mesa desde la API
      const pedidos = await obtenerPedidosPorMesa(mesaId);
      
      // Actualizar el estado con los pedidos obtenidos
      setMesasConPedidos(prevMesas => {
        return prevMesas.map(mesa => {
          if (mesa.id === mesaId) {
            return {
              ...mesa,
              pedidos: pedidos
            };
          }
          return mesa;
        });
      });
      
      console.log(`Cargados ${pedidos.length} pedidos para la mesa ${mesaId}`);
    } catch (error) {
      console.error(`Error al cargar pedidos de la mesa ${mesaId}:`, error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los pedidos de esta mesa. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setCargandoPedidosMesa(prev => ({
        ...prev,
        [mesaId]: false
      }));
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

  // Manejar cuando se expande una mesa
  const handleExpandMesa = (mesaId) => {
    // Si la mesa ya está expandida, la colapsamos
    if (expandedMesa === mesaId) {
      setExpandedMesa(null);
      return;
    }
    
    // Expandimos la mesa
    setExpandedMesa(mesaId);
    
    // Verificamos si ya tenemos los pedidos de esta mesa
    const mesa = mesasConPedidos.find(m => m.id === mesaId);
    
    // Si la mesa no tiene pedidos cargados, los cargamos
    if (!mesa.pedidos || mesa.pedidos.length === 0) {
      cargarPedidosDeMesa(mesaId);
    }
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
      setLoadingPedido(true);
      
      // Nos aseguramos de que pedidoId sea un número
      const pedidoIdNumerico = parseInt(pedidoId, 10);
      
      // Verificar si el parsing funcionó correctamente
      if (isNaN(pedidoIdNumerico)) {
        throw new Error(`El ID del pedido '${pedidoId}' no es un número válido`);
      }
      
      console.log(`Solicitando detalle del pedido con ID numérico: ${pedidoIdNumerico}`);
      
      // Obtener el detalle del pedido desde la API
      const detallePedido = await obtenerPedido(pedidoIdNumerico);
      
      // Guardar el detalle del pedido en el estado
      setPedidosDetalles(prev => ({
        ...prev,
        [pedidoId]: detallePedido
      }));
      
      return detallePedido;
    } catch (error) {
      console.error(`Error al cargar detalle del pedido ${pedidoId}:`, error);
      
      Alert.alert(
        'Error',
        'No se pudo cargar el detalle del pedido. Por favor, inténtalo de nuevo.'
      );
      return null;
    } finally {
      setLoadingPedido(false);
    }
  };

  // Manejar la expansión de un pedido
  const handleExpandPedido = async (pedidoId) => {
    // Si ya está expandido, colapsar
    if (expandedPedido === pedidoId) {
      setExpandedPedido(null);
      return;
    }
    
    // Expandir este pedido
    setExpandedPedido(pedidoId);
    
    // Si no tenemos los detalles de este pedido, cargarlos
    if (!pedidosDetalles[pedidoId]) {
      console.log(`Cargando detalles del pedido: ${pedidoId}`);
      await cargarDetallePedido(pedidoId);
    } else {
      console.log(`Usando detalles en caché para el pedido: ${pedidoId}`);
    }
  };

  // Renderizar cada ítem de un pedido
  const renderItem = (item) => {
    if (!item) return null;
    
    // Asegurándonos de que todos los valores numéricos estén definidos
    const cantidad = item.cantidad || 0;
    const nombre = item.nombre || 'Item sin nombre';
    const precio = item.precioUnitario || item.precio || 0;
    
    return (
      <View style={styles.itemContainer} key={item.id || `item-${Math.random()}`}>
        <Text style={styles.itemCantidad}>{cantidad}x</Text>
        <Text style={styles.itemNombre}>{nombre}</Text>
        <Text style={styles.itemPrecio}>${precio.toFixed(2)}</Text>
        <Text style={styles.itemTotal}>${(precio * cantidad).toFixed(2)}</Text>
      </View>
    );
  };

  // Renderizar cada pedido de una mesa
  const renderPedido = (pedido, mesaId) => {
    // Verificar que el pedido tenga un ID válido
    if (!pedido || !pedido.id) {
      console.error('Pedido inválido:', pedido);
      return null;
    }
    
    const detalle = pedidosDetalles[pedido.id];
    const isExpanded = expandedPedido === pedido.id;
    
    // Asegurar que el total del pedido sea un número
    const total = pedido.total || 0;
    
    // Adaptar la visualización según la estructura de datos real
    // La API puede devolver fechaPedido en lugar de fechaCreacion
    const fechaMostrar = pedido.fechaCreacion || pedido.fechaPedido || 'Fecha no disponible';
    const numeroOrdenMostrar = pedido.numeroOrden || `#${pedido.id}`;
    
    return (
      <View key={pedido.id} style={styles.pedidoContainer}>
        <TouchableOpacity
          style={styles.pedidoHeader}
          onPress={() => handleExpandPedido(pedido.id)}
        >
          <View>
            <Text style={styles.pedidoTitle}>
              Pedido {numeroOrdenMostrar}
            </Text>
            <Text style={styles.pedidoInfo}>
              {typeof fechaMostrar === 'string' ? new Date(fechaMostrar).toLocaleString() : 'Fecha no disponible'}
            </Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.totalPedido}>${typeof total === 'number' ? total.toFixed(2) : '0.00'}</Text>
            <Text style={[styles.mesaExpandIcon, {marginLeft: 10}]}>
              {isExpanded ? '▼' : '▶'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.pedidoDetalles}>
            {loadingPedido && !detalle ? (
              <ActivityIndicator size="small" color="#f8b500" style={{margin: 10}} />
            ) : detalle ? (
              <>
                <Text style={styles.detalleTitle}>DETALLE DE CONSUMO</Text>
                
                {Array.isArray(detalle.items) && detalle.items.length > 0 ? (
                  detalle.items.map(item => {
                    if (!item) return null;
                    return renderItem(item);
                  })
                ) : (
                  <Text style={styles.loadingText}>No hay ítems disponibles</Text>
                )}
                
                <View style={styles.divider} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    ${detalle.total !== undefined ? detalle.total.toFixed(2) : '0.00'}
                  </Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.pedidoActions}>
                  <TouchableOpacity
                    style={[styles.pedidoButton, styles.cerrarButton]}
                    onPress={() => cerrarCuenta(mesaId, pedido.id, detalle.total)}
                    disabled={processingPayment}
                  >
                    <Text style={styles.buttonText}>
                      {processingPayment ? 'Procesando...' : 'Cerrar Cuenta'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pedidoButton, styles.editarButton]}
                    onPress={() => navigation.navigate('EditarPedido', { pedidoId: pedido.id })}
                  >
                    <Text style={styles.buttonText}>Editar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.loadingText}>No se pudo cargar el detalle del pedido</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Renderizar cada mesa con sus pedidos
  const renderMesa = ({ item }) => {
    const isExpanded = expandedMesa === item.id;
    const estaCarandoPedidos = cargandoPedidosMesa[item.id];
    
    return (
      <View style={styles.mesaContainer}>
        <TouchableOpacity 
          style={styles.mesaHeader}
          onPress={() => handleExpandMesa(item.id)}
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
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.pedidosContainer}>
            {estaCarandoPedidos ? (
              <View>
                <ActivityIndicator size="small" color="#f8b500" style={{margin: 10}} />
                <Text style={styles.loadingText}>
                  Cargando pedidos activos...
                </Text>
              </View>
            ) : item.pedidos && item.pedidos.length > 0 ? (
              item.pedidos.map(pedido => renderPedido(pedido, item.id))
            ) : (
              <View>
                <Text style={styles.loadingText}>
                  No hay pedidos activos para esta mesa
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => cargarPedidosDeMesa(item.id)}
                >
                  <Text style={styles.refreshButtonText}>Recargar pedidos</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

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
    padding: 15,
    backgroundColor: '#fff',
  },
  detalleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemCantidad: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemNombre: {
    flex: 2,
    fontSize: 16,
  },
  itemPrecio: {
    width: 80,
    fontSize: 16,
    textAlign: 'right',
  },
  itemTotal: {
    width: 80,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
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