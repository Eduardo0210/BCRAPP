// api/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, getHeaders } from '../config';

const API_URL = getApiUrl();

// En api/services/authService.js
export const login = async (usuario, contraseña) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ usuario, contraseña })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error en la autenticación');
    }

    const data = await response.json();
    console.log('Token recibido del servidor:', data.token ? 'Sí' : 'No');
    
    // Guardar el token y datos del empleado en AsyncStorage
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
      console.log('Token guardado en AsyncStorage');
    } else {
      console.warn('No se recibió token del servidor');
    }
    
    if (data.empleado) {
      await AsyncStorage.setItem('empleado', JSON.stringify(data.empleado));
    }
    
    return data;
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};

// Cerrar sesión
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('empleado');
    return true;
  } catch (error) {
    console.error('Error en logout:', error);
    throw error;
  }
};

// Verificar si hay sesión activa
export const verificarSesion = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const empleadoJSON = await AsyncStorage.getItem('empleado');
    
    if (!token || !empleadoJSON) {
      return null;
    }
    
    const empleado = JSON.parse(empleadoJSON);
    return { token, empleado };
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return null;
  }
};