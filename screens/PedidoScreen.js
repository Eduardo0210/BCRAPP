import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import PedidoItem from '../components/PedidoItem';
import MenuItems from '../components/MenuItems';
import { 
  getMenu, 
  crearPedido, 
  obtenerPedido, 
  obtenerPedidosPorMesa, 
  agregarItemPedido 
} from '../api/services';

const PedidoScreen = ({ route, navigation }) => {
  const { mesaId, mesaNumero, mesaOcupada } = route.params;
  
  // Estados para el componente
  const [menuItems, setMenuItems] = useState([]);
  const [pedidoActual, setPedidoActual] = useState([]);
  const [pedidosExistentes, setPedidosExistentes] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Si la mesa está ocupada, cargar los pedidos existentes
        if (mesaOcupada) {
          const pedidos = await obtenerPedidosPorMesa(mesaId);
          setPedidosExistentes(pedidos);
          
          // Si hay pedidos, seleccionar el primero por defecto
          if (pedidos.length > 0) {
            const detallePedido = await obtenerPedido(pedidos[0].id);
            setPedidoSeleccionado(detallePedido);
            
            // Convertir los items del pedido al formato que espera el componente
            const items = detallePedido.items.map(item => ({
              item: {
                id: item.menuItemId,
                nombre: item.nombre,
                precio: item.precioUnitario
              },
              cantidad: item.cantidad,
              notas: item.notas
            }));
            
            setPedidoActual(items);
            setTotal(detallePedido.total);
          }
        }
        
        // Cargar menú
        setMenuLoading(true);
        const menu = await getMenu();
        setMenuItems(menu);
        setMenuLoading(false);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        Alert.alert(
          'Error de conexión',
          'No se pudieron cargar los datos. Por favor, verifica tu conexión e inténtalo de nuevo.'
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [mesaId, mesaOcupada]);

  // Actualizar el total cuando cambia el pedido
  useEffect(() => {
    let sum = 0;
    pedidoActual.forEach(item => {
      sum += item.cantidad * item.item.precio;
    });
    setTotal(sum);
  }, [pedidoActual]);

  // Función para añadir un ítem al pedido
  const addItemToPedido = (menuItem) => {
    // Verificar si el ítem ya está en el pedido
    const existingItemIndex = pedidoActual.findIndex(
      p => p.item.id === menuItem.id
    );

    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar la cantidad
      const updatedPedido = [...pedidoActual];
      updatedPedido[existingItemIndex].cantidad += 1;
      setPedidoActual(updatedPedido);
    } else {
      // Si no existe, añadirlo con cantidad 1
      setPedidoActual([
        ...pedidoActual,
        { item: menuItem, cantidad: 1 }
      ]);
    }
  };

  // Función para eliminar un ítem del pedido
  const removeItemFromPedido = (index) => {
    const updatedPedido = [...pedidoActual];
    updatedPedido.splice(index, 1);
    setPedidoActual(updatedPedido);
  };

  // Función para guardar el pedido
  const guardarPedido = async () => {
    if (pedidoActual.length === 0) {
      Alert.alert('Error', 'No puedes guardar un pedido vacío');
      return;
    }

    try {
      setCreatingOrder(true);
      
      // Preparar datos del pedido
      const pedidoData = {
        mesaId: mesaId,
        notas: '',
        esParaLlevar: mesaNumero === 'Para llevar',
        nombreCliente: mesaNumero === 'Para llevar' ? 'Cliente' : null,
        telefonoCliente: null,
        items: pedidoActual
      };
      
      // Crear el pedido en la API
      const nuevoPedido = await crearPedido(pedidoData);
      
      Alert.alert(
        'Pedido Guardado',
        `Pedido para ${mesaNumero === 'Para llevar' ? 'llevar' : `Mesa ${mesaNumero}`} guardado con éxito`,
        [{ 
          text: 'OK',
          onPress: () => navigation.goBack()
        }]
      );
      
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el pedido. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  // Función para seleccionar un pedido existente
  const seleccionarPedido = async (pedidoId) => {
    try {
      setLoading(true);
      const detallePedido = await obtenerPedido(pedidoId);
      setPedidoSeleccionado(detallePedido);
      
      // Convertir los items del pedido al formato que espera el componente
      const items = detallePedido.items.map(item => ({
        item: {
          id: item.menuItemId,
          nombre: item.nombre,
          precio: item.precioUnitario
        },
        cantidad: item.cantidad,
        notas: item.notas
      }));
      
      setPedidoActual(items);
      setTotal(detallePedido.total);
    } catch (error) {
      console.error('Error al seleccionar pedido:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar el pedido seleccionado. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para crear un nuevo pedido
  const crearNuevoPedido = () => {
    setPedidoSeleccionado(null);
    setPedidoActual([]);
    setTotal(0);
  };

  // Renderizar cada ítem del pedido
  const renderPedidoItem = ({ item, index }) => (
    <PedidoItem
      item={item.item}
      cantidad={item.cantidad}
      onDelete={() => removeItemFromPedido(index)}
    />
  );

  // Mostrar indicador de carga mientras se obtienen los datos
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#f8b500" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {mesaNumero === 'Para llevar' ? 'Pedido para llevar' : `Pedido Mesa ${mesaNumero}`}
        </Text>
        
        {/* Si la mesa está ocupada, mostrar selector de pedidos existentes */}
        {mesaOcupada && pedidosExistentes.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.pedidosSelector}
          >
            {pedidosExistentes.map(pedido => (
              <TouchableOpacity
                key={pedido.id}
                style={[
                  styles.pedidoTab,
                  pedidoSeleccionado && pedidoSeleccionado.id === pedido.id ? 
                    styles.pedidoTabSelected : {}
                ]}
                onPress={() => seleccionarPedido(pedido.id)}
              >
                <Text 
                  style={[
                    styles.pedidoTabText,
                    pedidoSeleccionado && pedidoSeleccionado.id === pedido.id ? 
                      styles.pedidoTabTextSelected : {}
                  ]}
                >
                  Pedido #{pedido.id.toString().slice(-4)}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[
                styles.pedidoTab,
                styles.nuevoPedidoTab,
                !pedidoSeleccionado ? styles.pedidoTabSelected : {}
              ]}
              onPress={crearNuevoPedido}
            >
              <Text 
                style={[
                  styles.pedidoTabText,
                  !pedidoSeleccionado ? styles.pedidoTabTextSelected : {}
                ]}
              >
                + Nuevo Pedido
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <View style={styles.pedidoContainer}>
        <Text style={styles.sectionTitle}>Elementos del Pedido</Text>
        {pedidoActual.length > 0 ? (
          <FlatList
            data={pedidoActual}
            renderItem={renderPedidoItem}
            keyExtractor={(item, index) => index.toString()}
          />
        ) : (
          <Text style={styles.emptyMessage}>No hay elementos en el pedido</Text>
        )}

        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: ${total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#f8b500" />
            <Text style={styles.loadingText}>Cargando menú...</Text>
          </View>
        ) : (
          <MenuItems 
            items={menuItems} 
            onAddItem={addItemToPedido} 
          />
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.guardarButton,
          (creatingOrder || pedidoActual.length === 0) && styles.guardarButtonDisabled
        ]}
        onPress={guardarPedido}
        disabled={creatingOrder || pedidoActual.length === 0}
      >
        {creatingOrder ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.guardarButtonText}>
            {pedidoSeleccionado ? 'Actualizar Pedido' : 'Guardar Pedido'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#f8b500',
    padding: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pedidosSelector: {
    flexDirection: 'row',
    marginTop: 10,
  },
  pedidoTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  pedidoTabSelected: {
    backgroundColor: '#fff',
  },
  pedidoTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pedidoTabTextSelected: {
    color: '#f8b500',
  },
  nuevoPedidoTab: {
    backgroundColor: '#4caf50',
  },
  pedidoContainer: {
    flex: 1,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
  totalContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    elevation: 2,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  menuContainer: {
    flex: 2,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    elevation: 5,
  },
  guardarButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  guardarButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
  guardarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PedidoScreen;