import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  TextInput 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMesas,cerrarCuentaMesa,obtenerPedidosPorMesa,obtenerPedidosParaLlevar } from '../api/services';
import { logout } from '../api/services';
import Mesa from '../components/Mesa';
import Header from '../components/Header';

const HomeScreen = ({ navigation }) => {
  // Estado para manejar las mesas
  const [mesas, setMesas] = useState([]);
  const [pedidosParaLlevar, setPedidosParaLlevar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [empleado, setEmpleado] = useState(null);

  const [modalPersonasVisible, setModalPersonasVisible] = useState(false);
const [inputPersonas, setInputPersonas] = useState('');
const [mesaSeleccionada, setMesaSeleccionada] = useState(null); // si no lo tienes ya


  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [personaActual, setPersonaActual] = useState(1);
  const [totalPorDividir, setTotalPorDividir] = useState(0);
  const [numeroPersonas, setNumeroPersonas] = useState(0);
  const [montoActual, setMontoActual] = useState('');
  const [pagosPorPersona, setPagosPorPersona] = useState([]);
  



  // Obtener información del empleado conectado
  useEffect(() => {
    const obtenerEmpleado = async () => {
      try {
        const empleadoJSON = await AsyncStorage.getItem('empleado');
        if (empleadoJSON) {
          setEmpleado(JSON.parse(empleadoJSON));
        }
      } catch (error) {
        console.error('Error al obtener información del empleado:', error);
      }
    };

    obtenerEmpleado();
  }, []);

  // Prevenir retroceso con botón físico en Android (para cerrar sesión)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Mostrar diálogo de confirmación para cerrar sesión
        Alert.alert(
          'Cerrar Sesión',
          '¿Estás seguro de que deseas cerrar sesión?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => {} },
            { 
              text: 'Sí, Cerrar Sesión', 
              style: 'destructive', 
              onPress: handleLogout 
            },
          ]
        );
        return true; // Evitar comportamiento predeterminado
      }
    );

    return () => backHandler.remove();
  }, []);

  // Función para cargar los datos de las mesas y pedidos para llevar desde la API
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [mesasData, pedidosParaLlevarData] = await Promise.all([
        getMesas(),
        obtenerPedidosParaLlevar()
      ]);
      
      console.log('Mesas:', mesasData);
      console.log('Pedidos para llevar:', pedidosParaLlevarData);
      
      // Filtrar la Mesa para llevar (ID 6) de la lista de mesas normales
      setMesas(mesasData.filter(mesa => mesa.id !== 6));
      setPedidosParaLlevar(pedidosParaLlevarData);
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

  // Cargar los datos al inicio y cuando volvemos a esta pantalla
  useEffect(() => {
    cargarDatos();

    // Configurar un listener para cuando el usuario regrese a esta pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      cargarDatos();
    });

    return unsubscribe;
  }, [navigation]);

  // Función para refrescar manualmente los datos
  const handleRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  // Función para manejar el toque en una mesa
  const handleMesaPress = (mesa) => {
    navigation.navigate('Pedido', { 
      mesaId: mesa.id, 
      mesaNumero: mesa.numero,
      mesaOcupada: mesa.ocupada
    });
  };

  // Función para crear nuevo ticket para llevar (ir directo a crear pedido)
  const crearNuevoTicketParaLlevar = () => {
    // Navegar directamente a la pantalla de pedido con Mesa ID 6
    navigation.navigate('Pedido', {
      mesaId: 6, // Mesa para llevar es MesaID = 6
      mesaNumero: 'Para Llevar',
      mesaOcupada: false,
      esParaLlevar: true
    });
  };

  // Función para manejar el toque en un pedido para llevar
  const handlePedidoParaLlevarPress = (pedido) => {
    navigation.navigate('Pedido', {
      mesaId: 6, // Mesa para llevar es MesaID = 6
      mesaNumero: `Ticket ${pedido.numeroTicket}`,
      mesaOcupada: true,
      esParaLlevar: true,
      pedidoId: pedido.id
    });
  };

  // Función para cerrar un pedido para llevar individual
  const handleCerrarPedidoParaLlevar = async (pedido) => {
    try {
      // Mostrar diálogo para seleccionar método de pago
      Alert.alert(
        `Cerrar Pedido ${pedido.numeroTicket}`,
        `Total: $${pedido.total.toFixed(2)}\n¿Cómo deseas procesar el pago?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Efectivo',
            onPress: () => procesarCierrePedidoParaLlevar(pedido, 'Efectivo')
          },
          {
            text: 'Tarjeta',
            onPress: () => procesarCierrePedidoParaLlevar(pedido, 'Tarjeta')
          }
        ]
      );
    } catch (error) {
      console.error('Error al iniciar cierre de pedido:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso de cierre.');
    }
  };

  // Función para procesar el cierre de un pedido para llevar
  const procesarCierrePedidoParaLlevar = async (pedido, metodoPago) => {
    try {
      setLoading(true);
      
      // Usar la misma función de cerrar cuenta pero con la mesa para llevar (ID 6)
      const resultado = await cerrarCuentaMesa(6, metodoPago);
      
      // Mostrar resumen para impresión
      navigation.navigate('ResumenTicket', { 
        resumen: resultado.resumen,
        mesaId: 6,
        metodoPago: metodoPago,
        esParaLlevar: true,
        numeroTicket: pedido.numeroTicket
      });
      
      // Recargar los datos para actualizar la lista
      await cargarDatos();
    } catch (error) {
      console.error('Error al cerrar el pedido:', error);
      Alert.alert('Error', 'No se pudo cerrar el pedido. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión correctamente.');
    }
  };

  const handleCerrarCuenta = async (mesa) => {
    try {
      setLoading(true);
      const pedidos = await obtenerPedidosPorMesa(mesa.id);
      const total = pedidos.reduce((acc, pedido) => acc + (pedido.total || 0), 0);
      setTotalPorDividir(total);
      setMesaSeleccionada(mesa); // ← ¡Importante!
      setLoading(false);
  
      Alert.alert(
        `Cerrar cuenta - Mesa ${mesa.numero}`,
        `Total: $${total.toFixed(2)}\n¿Deseas dividir la cuenta entre varias personas?`,
        [
          {
            text: "No",
            onPress: () => procesarCierreCuenta(mesa.id, 'Efectivo') // o puedes mostrar selección aquí
          },
          {
            text: "Sí",
            onPress: () => {
              setInputPersonas('');
              setModalPersonasVisible(true);
            }
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo obtener el total de la cuenta.');
      console.error('Error al cerrar cuenta:', error);
    }
  };
  
  

  

  
  

  const procesarCierreCuentaDividido = async (mesaId, pagos) => {
    try {
      setLoading(true);
      console.log(pagos)
      // Llamar a la API para cerrar la cuenta con división de pagos
      const resultado = await cerrarCuentaMesa(mesaId, null, pagos); // Ajusta backend para aceptar este array
  
      navigation.navigate('ResumenTicket', { 
        resumen: resultado.resumen,
        mesaId,
        metodoPago: 'Dividido',
        pagos
      });
  
      cargarMesas();
    } catch (error) {
      console.error('Error al cerrar cuenta dividida:', error);
      Alert.alert('Error', 'No se pudo cerrar la cuenta dividida.');
    } finally {
      setLoading(false);
    }
  };
  

  const registrarPagoPersona = (metodo) => {
    const monto = parseFloat(montoActual);
    if (isNaN(monto) || monto <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto válido.');
      return;
    }
  
    const nuevosPagos = [...pagosPorPersona, { metodo, monto }];
    const sumaPagos = nuevosPagos.reduce((sum, p) => sum + p.monto, 0);
  
    if (nuevosPagos.length === numeroPersonas) {
      if (Math.abs(sumaPagos - totalPorDividir) > 0.01) {
        Alert.alert('Error en suma', `La suma total ($${sumaPagos.toFixed(2)}) no coincide con el total ($${totalPorDividir.toFixed(2)}).`);
        return;
      }
  
      setModalPagoVisible(false); // ✔️ sólo aquí
      setMontoActual('');
      procesarCierreCuentaDividido(mesaSeleccionada.id, nuevosPagos); // usa mesaSeleccionada correctamente
    } else {
      setPagosPorPersona(nuevosPagos);
      setPersonaActual(personaActual + 1);
      setMontoActual('');
    }
  };
  
  
  

  // const handleCerrarCuenta = (mesa) => {
  //   // Mostrar diálogo para seleccionar método de pago
  //   Alert.alert(
  //     'Cerrar Cuenta',
  //     `¿Cómo deseas procesar el pago de la Mesa ${mesa.numero}?`,
  //     [
  //       { text: 'Cancelar', style: 'cancel' },
  //       {
  //         text: 'Efectivo',
  //         onPress: () => procesarCierreCuenta(mesa.id, 'Efectivo')
  //       },
  //       {
  //         text: 'Tarjeta',
  //         onPress: () => procesarCierreCuenta(mesa.id, 'Tarjeta')
  //       }
  //     ]
  //   );
  // };
  
  // Función para procesar el cierre de cuenta
  const procesarCierreCuenta = async (mesaId, metodoPago) => {
    try {
      // Mostrar indicador de carga
      setLoading(true);
      
      // Llamar al servicio para cerrar la cuenta
      const resultado = await cerrarCuentaMesa(mesaId, metodoPago);
      
      // Mostrar resumen para impresión
      navigation.navigate('ResumenTicket', { 
        resumen: resultado.resumen,
        mesaId: mesaId,
        metodoPago: metodoPago
      });
      
      // Recargar las mesas después de cerrar la cuenta
      cargarMesas();
    } catch (error) {
      console.error('Error al cerrar la cuenta:', error);
      Alert.alert('Error', 'No se pudo cerrar la cuenta. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar la función renderMesa
  const renderMesa = ({ item }) => (
    <Mesa
      numero={item.numero}
      ocupada={item.ocupada}
      pedidos={item.pedidosActivos}
      onPress={() => handleMesaPress(item)}
      onCerrarCuenta={() => handleCerrarCuenta(item)}
    />
  );

  // Mostrar indicador de carga mientras se obtienen los datos
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando mesas...</Text>
      </View>
    );
  }

  return (
    <>
    <View style={styles.container}>
      <Header 
        title={`Mesas - ${empleado ? empleado.nombre : 'Usuario'}`}
        showLogout
        onLogout={handleLogout}
      />
      
      <View style={styles.mesasContainer}>
        {/* Sección Para Llevar */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos Para Llevar</Text>
            <TouchableOpacity
              style={styles.nuevoTicketButton}
              onPress={crearNuevoTicketParaLlevar}
            >
              <Text style={styles.nuevoTicketButtonText}>+ Nuevo Ticket</Text>
            </TouchableOpacity>
          </View>
          
          {pedidosParaLlevar.length > 0 ? (
            <FlatList
              data={pedidosParaLlevar}
              renderItem={({ item }) => (
                <View style={styles.ticketItem}>
                  <TouchableOpacity
                    style={styles.ticketContent}
                    onPress={() => handlePedidoParaLlevarPress(item)}
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketNumero}>{item.numeroTicket}</Text>
                      <Text style={styles.ticketEstado}>{item.estado}</Text>
                    </View>
                    <Text style={styles.ticketTotal}>${item.total.toFixed(2)}</Text>
                    <Text style={styles.ticketItems}>{item.numeroItems} items</Text>
                    {item.notas && (
                      <Text style={styles.ticketNotas} numberOfLines={1}>
                        {item.notas}
                      </Text>
                    )}
                  </TouchableOpacity>
                  
                  {/* Botón para cerrar pedido */}
                  <TouchableOpacity
                    style={styles.cerrarPedidoButton}
                    onPress={() => handleCerrarPedidoParaLlevar(item)}
                  >
                    <Text style={styles.cerrarPedidoButtonText}>Cerrar y Cobrar</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No hay tickets activos</Text>
          )}
        </View>

        {/* Sección Mesas Normales */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Mesas del Restaurante</Text>
          
          {mesas.length > 0 ? (
            <FlatList
              data={mesas}
              renderItem={renderMesa}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay mesas disponibles</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={cargarDatos}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.resumenButton}
          onPress={() => navigation.navigate('Resumen')}
        >
          <Text style={styles.buttonText}>Ver Todos los Pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => navigation.navigate('Estadisticas')}
        >
          <Text style={styles.buttonText}>Estadísticas</Text>
        </TouchableOpacity>
      </View>
    </View>

    {modalPersonasVisible && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Dividir Cuenta</Text>
      <Text style={styles.modalSubtitle}>Total: ${totalPorDividir.toFixed(2)}</Text>
      <TextInput
        style={styles.input}
        placeholder="¿Cuántas personas pagarán?"
        keyboardType="numeric"
        value={inputPersonas}
        onChangeText={setInputPersonas}
      />
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: '#2ecc71' }]}
          onPress={() => {
            const personas = parseInt(inputPersonas);
            if (isNaN(personas) || personas <= 0) {
              Alert.alert('Número inválido', 'Ingresa un número válido.');
              return;
            }
            setNumeroPersonas(personas);
            setPersonaActual(1);
            setPagosPorPersona([]);
            setModalPersonasVisible(false);
            setModalPagoVisible(true);
          }}
        >
          <Text style={styles.modalButtonText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: '#e74c3c' }]}
          onPress={() => setModalPersonasVisible(false)}
        >
          <Text style={styles.modalButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}

{modalPagoVisible && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Persona {personaActual}</Text>
      <Text style={styles.modalSubtitle}>Total: ${totalPorDividir.toFixed(2)}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="¿Cuánto va a pagar?"
        keyboardType="numeric"
        value={montoActual}
        onChangeText={setMontoActual}
      />

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: '#2ecc71' }]}
          onPress={() => registrarPagoPersona('Efectivo')}
        >
          <Text style={styles.modalButtonText}>Efectivo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: '#3498db' }]}
          onPress={() => registrarPagoPersona('Tarjeta')}
        >
          <Text style={styles.modalButtonText}>Tarjeta</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}


    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  mesasContainer: {
    flex: 1,
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  resumenButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    marginRight: 5,
    alignItems: 'center',
  },
  statsButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 5,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nuevoTicketButton: {
    backgroundColor: '#f8b500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  nuevoTicketButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ticketItem: {
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f8b500',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flex: 1,
  },
  ticketContent: {
    padding: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  ticketNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8b500',
  },
  ticketEstado: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 2,
  },
  ticketItems: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  ticketNotas: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  cerrarPedidoButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 5,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cerrarPedidoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});

export default HomeScreen;