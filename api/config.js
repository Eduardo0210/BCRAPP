// api/config.js
// Reemplaza esta URL con la dirección de tu API REST
const API_URL = 'https://bcr.dyndns.org:3443/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getApiUrl = () => API_URL;

export const getHeaders = async (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Si necesitamos incluir el token de autenticación
  if (includeAuth) {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token obtenido para petición:', token ? 'Sí' : 'No');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('No se encontró token en AsyncStorage');
      }
    } catch (error) {
      console.error('Error al obtener el token:', error);
    }
  }

  return headers;
};