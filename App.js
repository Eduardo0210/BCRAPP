import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importación de pantallas
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PedidoScreen from './screens/PedidoScreen';
import ResumenScreen from './screens/ResumenScreen';
import ResumenTicketScreen from './screens/ResumenTicketScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Pantalla de Login */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Pantallas principales (requieren autenticación) */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Birria CR - Mesas',
            headerLeft: null, // Deshabilitar botón de retroceso
            headerStyle: {
              backgroundColor: '#f8b500',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            gestureEnabled: false // Deshabilitar gesto de retroceso en iOS
          }}
        />
        <Stack.Screen
          name="Pedido"
          component={PedidoScreen}
          options={{
            title: 'Crear Pedido',
            headerStyle: {
              backgroundColor: '#f8b500',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="Resumen"
          component={ResumenScreen}
          options={{
            title: 'Resumen de Pedidos',
            headerStyle: {
              backgroundColor: '#f8b500',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />


        <Stack.Screen
          name="ResumenTicket"
          component={ResumenTicketScreen}
          options={{
            title: 'Resumen de Ticket',
            headerStyle: {
              backgroundColor: '#f8b500',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}