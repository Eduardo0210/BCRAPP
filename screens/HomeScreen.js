import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMesas,cerrarCuentaMesa,obtenerPedidosPorMesa } from '../api/services';
import { logout } from '../api/services';
import Mesa from '../components/Mesa';
import Header from '../components/Header';

const HomeScreen = ({ navigation }) => {
  // Estado para manejar las mesas
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [empleado, setEmpleado] = useState(null);

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

  // Función para cargar los datos de las mesas desde la API
  const cargarMesas = async () => {
    try {
      setLoading(true);
      const mesasData = await getMesas();
      setMesas(mesasData);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudieron cargar los datos de las mesas. Por favor, verifica tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar las mesas al inicio y cuando volvemos a esta pantalla
  useEffect(() => {
    cargarMesas();

    // Configurar un listener para cuando el usuario regrese a esta pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      cargarMesas();
    });

    return unsubscribe;
  }, [navigation]);

  // Función para refrescar manualmente los datos
  const handleRefresh = () => {
    setRefreshing(true);
    cargarMesas();
  };

  // Función para manejar el toque en una mesa
  const handleMesaPress = (mesa) => {
    navigation.navigate('Pedido', { 
      mesaId: mesa.id, 
      mesaNumero: mesa.numero,
      mesaOcupada: mesa.ocupada
    });
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

  const handleCerrarCuenta = (mesa) => {
    // Mostrar diálogo para seleccionar método de pago
    Alert.alert(
      'Cerrar Cuenta',
      `¿Cómo deseas procesar el pago de la Mesa ${mesa.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Efectivo',
          onPress: () => procesarCierreCuenta(mesa.id, 'Efectivo')
        },
        {
          text: 'Tarjeta',
          onPress: () => procesarCierreCuenta(mesa.id, 'Tarjeta')
        }
      ]
    );
  };
  
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
    <View style={styles.container}>
      <Header 
        title={`Mesas - ${empleado ? empleado.nombre : 'Usuario'}`}
        showLogout
        onLogout={handleLogout}
      />
      
      <View style={styles.mesasContainer}>
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
              onPress={cargarMesas}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
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
  );
};

const styles = StyleSheet.create({
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
});

export default HomeScreen;