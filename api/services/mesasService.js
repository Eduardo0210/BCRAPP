// api/services/mesasService.js
import { getApiUrl, getHeaders } from '../config';

const API_URL = getApiUrl();


export const cerrarCuentaMesa = async (mesaId, metodoPago) => {
  try {
    const url = `${API_URL}/mesas/${mesaId}/cerrar-cuenta`;
    console.log('URL de petición:', url);
    
    const headers = await getHeaders(true);
    console.log('Headers:', JSON.stringify(headers));
    
    const body = JSON.stringify({ metodoPago });
    console.log('Body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    });

    console.log('Respuesta status:', response.status);
    
    // Si no es JSON, intentar leer el texto para ver el error
    if (!response.ok) {
      const text = await response.text();
      console.error('Respuesta de error (texto):', text);
      throw new Error(`Error HTTP: ${response.status}. Respuesta: ${text.slice(0, 100)}...`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al cerrar la cuenta de la mesa:', error);
    throw error;
  }
};
// Obtener todas las mesas
export const getMesas = async () => {
  try {
    const response = await fetch(`${API_URL}/mesas`, {
      method: 'GET',
      headers: await getHeaders(true)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener las mesas:', error);
    throw error;
  }
};

// Obtener una mesa por ID
export const getMesaPorId = async (mesaId) => {
  try {
    const response = await fetch(`${API_URL}/mesas/${mesaId}`, {
      method: 'GET',
      headers: await getHeaders(true)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error al obtener la mesa ${mesaId}:`, error);
    throw error;
  }
};