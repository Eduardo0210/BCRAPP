import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput
} from 'react-native';
import PedidoItem from '../components/PedidoItem';
import MenuItems from '../components/MenuItems';
import { 
  getMenu, 
  crearPedido, 
  obtenerPedido, 
  obtenerPedidosPorMesa, 
  agregarItemPedido,
  actualizarPedido,
  reemplazarItemsPedido
} from '../api/services';
import * as Haptics from 'expo-haptics';
import { imprimirTicketTexto } from '../utils/imprimirTicket';



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

  const [mostrarCantidadModal, setMostrarCantidadModal] = useState(false);
const [productoSeleccionado, setProductoSeleccionado] = useState(null);
const [cantidadTemporal, setCantidadTemporal] = useState('');

const [mostrarTipoCarneModal, setMostrarTipoCarneModal] = useState(false);
const [tipoCarneSeleccionado, setTipoCarneSeleccionado] = useState('');

const [cantidadTipoCarne, setCantidadTipoCarne] = useState('1');

const [editandoIndex, setEditandoIndex] = useState(null);
const [nuevoProducto, setNuevoProducto] = useState(null);
const [nuevaCantidad, setNuevaCantidad] = useState('1');
const [nuevoTipoCarne, setNuevoTipoCarne] = useState('');
const [mostrarEditarModal, setMostrarEditarModal] = useState(false);


// Generar texto para impresión en cocina
const textoCocina = `
***** ORDEN DE COCINA *****

Mesa: ${mesaNumero}

${pedidoActual.map(p => {
  const linea = `${p.cantidad}x ${p.item.nombre}`;
  const carne = p.notas ? `  (${p.notas})` : '';
  return `- ${linea}${carne}`;
}).join('\n')}

***************************
`;


const editarItem = (index) => {
  const item = pedidoActual[index];
  setEditandoIndex(index);
  setNuevoProducto(item.item);
  setNuevaCantidad(item.cantidad.toString());
  setNuevoTipoCarne(item.notas || '');
  setMostrarEditarModal(true);
};


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
        //console.log(menu)
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
  // const addItemToPedido = (menuItem) => {
  //   // Verificar si el ítem ya está en el pedido
  //   const existingItemIndex = pedidoActual.findIndex(
  //     p => p.item.id === menuItem.id
  //   );

  //   if (existingItemIndex >= 0) {
  //     // Si ya existe, incrementar la cantidad
  //     const updatedPedido = [...pedidoActual];
  //     updatedPedido[existingItemIndex].cantidad += 1;
  //     setPedidoActual(updatedPedido);
  //   } else {
  //     // Si no existe, añadirlo con cantidad 1
  //     setPedidoActual([
  //       ...pedidoActual,
  //       { item: menuItem, cantidad: 1 }
  //     ]);
  //   }
  // };

  const addItemToPedido = (menuItem) => {
    console.log(menuItem)
    if (menuItem.requiereTipoCarne) {
      setProductoSeleccionado(menuItem);
      setTipoCarneSeleccionado('');
      setMostrarTipoCarneModal(true);
      return;
    }
    const fraccionable = menuItem.nombre.toLowerCase().includes('kilo');
  
    if (fraccionable) {
      // Mostrar el modal personalizado para capturar decimales
      setProductoSeleccionado(menuItem);
      setCantidadTemporal('');
      setMostrarCantidadModal(true);
      return;
    }
  
    // Comportamiento normal para ítems no fraccionables (enteros)
    const existingItemIndex = pedidoActual.findIndex(
      p => p.item.id === menuItem.id
    );
  
    if (existingItemIndex >= 0) {
      const updatedPedido = [...pedidoActual];
      updatedPedido[existingItemIndex].cantidad += 1;
      setPedidoActual(updatedPedido);
    } else {
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
      
      let pedidoGuardado;

      if (pedidoSeleccionado) {
        // 🟡 1. Actualizar pedido
        await actualizarPedido(pedidoSeleccionado.id, pedidoData);
      
        // 🔴 2. Reemplazar items anteriores
        await reemplazarItemsPedido(pedidoSeleccionado.id);
      
        // 🟢 3. Agregar todos los ítems nuevos
        for (const item of pedidoActual) {
          await agregarItemPedido(pedidoSeleccionado.id, {
            menuItemId: item.item.id,
            cantidad: item.cantidad,
            notas: item.notas || null
          });
        }
      
        pedidoGuardado = await obtenerPedido(pedidoSeleccionado.id);
      }
       else {
        // 🆕 CREAR nuevo pedido
        pedidoGuardado = await crearPedido(pedidoData);
      }

      try {
        await imprimirTicketTexto(textoCocina);
      } catch (printError) {
        console.warn("Error al imprimir, pero se guardó el pedido:", printError.message);
      }
      
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
    notas={item.notas}
    onDelete={() => removeItemFromPedido(index)}
    onEdit={() => editarItem(index)}
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
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mesaNumero === 'Para llevar' ? 'Pedido para llevar' : `Pedido Mesa ${mesaNumero}`}
          </Text>
          
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
  
      {/* Modal personalizado para fracciones */}
      {mostrarCantidadModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cantidad personalizada</Text>
            <Text>Ingresa la cantidad en kilos (ej. 0.5 para medio kilo)</Text>
            <TextInput
              style={styles.modalInput}
              value={cantidadTemporal}
              onChangeText={setCantidadTemporal}
              keyboardType="decimal-pad"
              placeholder="Ej: 0.5"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setMostrarCantidadModal(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const cantidad = parseFloat(cantidadTemporal);
                  if (isNaN(cantidad) || cantidad <= 0) {
                    Alert.alert('Error', 'Cantidad inválida');
                    return;
                  }
  
                  const updatedPedido = [...pedidoActual];
                  const existingIndex = updatedPedido.findIndex(p => p.item.id === productoSeleccionado.id);
  
                  if (existingIndex >= 0) {
                    updatedPedido[existingIndex].cantidad += cantidad;
                  } else {
                    updatedPedido.push({ item: productoSeleccionado, cantidad });
                  }
  
                  setPedidoActual(updatedPedido);
                  setMostrarCantidadModal(false);
                }}
              >
                <Text style={styles.modalAccept}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {mostrarTipoCarneModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona el tipo de carne</Text>
            {['Surtida', 'Maciza', 'Costilla'].map(tipo => (
              <TouchableOpacity key={tipo} onPress={() => setTipoCarneSeleccionado(tipo)}>
                <Text style={{
                  padding: 10,
                  backgroundColor: tipoCarneSeleccionado === tipo ? '#4caf50' : '#eee',
                  color: tipoCarneSeleccionado === tipo ? '#fff' : '#333',
                  borderRadius: 5,
                  marginVertical: 5,
                  textAlign: 'center'
                }}>
                  {tipo}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.modalLabel}>Cantidad:</Text>
            <View style={styles.counterContainer}>
            <TouchableOpacity
  style={styles.counterButton}
  onPress={() => {
    Haptics.selectionAsync(); // <-- feedback háptico
    setCantidadTipoCarne(prev => Math.max(1, parseInt(prev) - 1));
  }}
>
  <Text style={styles.counterText}>-</Text>
</TouchableOpacity>
<Text style={styles.counterValue}>{cantidadTipoCarne}</Text>
<TouchableOpacity
  style={styles.counterButton}
  onPress={() => {
    Haptics.selectionAsync(); // <-- feedback háptico
    setCantidadTipoCarne(prev => (parseInt(prev) + 1).toString());
  }}
>
  <Text style={styles.counterText}>+</Text>
</TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setMostrarTipoCarneModal(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const cantidad = parseInt(cantidadTipoCarne);
                  if (isNaN(cantidad) || cantidad <= 0) {
                    Alert.alert('Error', 'Cantidad inválida');
                    return;
                  }

                  const updatedPedido = [...pedidoActual];
                  const existingIndex = updatedPedido.findIndex(p =>
                    p.item.id === productoSeleccionado.id &&
                    p.notas === tipoCarneSeleccionado
                  );

                  if (existingIndex >= 0) {
                    updatedPedido[existingIndex].cantidad += cantidad;
                  } else {
                    updatedPedido.push({
                      item: productoSeleccionado,
                      cantidad,
                      notas: tipoCarneSeleccionado
                    });
                  }

                  setPedidoActual(updatedPedido);
                  setMostrarTipoCarneModal(false);
                  setCantidadTipoCarne('1');
                  setTipoCarneSeleccionado(null);
                }}
              >
                <Text style={styles.modalAccept}>Agregar</Text>
              </TouchableOpacity>


            </View>
          </View>
        </View>
      )}

      {mostrarEditarModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar elemento</Text>
            <Text>{nuevoProducto.nombre}</Text>

            <Text style={styles.modalLabel}>Cantidad:</Text>
            <TextInput
              style={styles.modalInput}
              value={nuevaCantidad}
              onChangeText={setNuevaCantidad}
              keyboardType="numeric"
            />

            {nuevoProducto.requiereTipoCarne && (
              <>
                <Text style={styles.modalLabel}>Tipo de carne:</Text>
                {['Surtida', 'Maciza', 'Costilla'].map(tipo => (
                  <TouchableOpacity key={tipo} onPress={() => setNuevoTipoCarne(tipo)}>
                    <Text style={{
                      padding: 10,
                      backgroundColor: nuevoTipoCarne === tipo ? '#4caf50' : '#eee',
                      color: nuevoTipoCarne === tipo ? '#fff' : '#333',
                      borderRadius: 5,
                      marginVertical: 5,
                      textAlign: 'center'
                    }}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setMostrarEditarModal(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                const cantidad = parseInt(nuevaCantidad);
                if (isNaN(cantidad) || cantidad <= 0) {
                  Alert.alert('Cantidad inválida');
                  return;
                }

                const updated = [...pedidoActual];
                updated[editandoIndex] = {
                  item: nuevoProducto,
                  cantidad,
                  notas: nuevoTipoCarne || null
                };
                setPedidoActual(updated);
                setMostrarEditarModal(false);
              }}>
                <Text style={styles.modalAccept}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </>
  );
  

  
};

const styles = StyleSheet.create({
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  counterButton: {
    backgroundColor: '#f8b500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  counterText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center'
  }
,  
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
// 👇 Pega esto al final del objeto
modalOverlay: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
modalContainer: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 10,
  width: '80%',
  elevation: 10,
},
modalTitle: {
  fontWeight: 'bold',
  fontSize: 16,
  marginBottom: 10,
},
modalInput: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  padding: 10,
  marginTop: 10,
  marginBottom: 20,
  fontSize: 16,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
modalCancel: {
  color: 'red',
  fontWeight: 'bold',
  fontSize: 16,
},
modalAccept: {
  color: 'green',
  fontWeight: 'bold',
  fontSize: 16
}
  
});

export default PedidoScreen;