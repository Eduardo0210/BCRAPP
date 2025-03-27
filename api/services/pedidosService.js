// api/services/pedidosService.js
import { getApiUrl, getHeaders } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = getApiUrl();


// api/services/pedidosService.js


export const crearPedido = async (pedidoData) => {
  try {
    // Verificar si tenemos token antes de hacer la petición
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible para la petición');
      throw new Error('No se proporcionó token de autenticación');
    }
    
    const headers = await getHeaders(true);
    console.log('Headers para petición:', JSON.stringify(headers));
    
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(pedidoData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al crear el pedido:', error);
    throw error;
  }
};

// Obtener un pedido por ID
export const obtenerPedido = async (pedidoId) => {
  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
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
    console.error(`Error al obtener el pedido ${pedidoId}:`, error);
    throw error;
  }
};

// Obtener pedidos por mesa
export const obtenerPedidosPorMesa = async (mesaId) => {
  try {
    const response = await fetch(`${API_URL}/pedidos/mesa/${mesaId}`, {
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
    console.error(`Error al obtener pedidos para la mesa ${mesaId}:`, error);
    throw error;
  }
};

// Agregar item a un pedido
export const agregarItemPedido = async (pedidoId, itemData) => {
  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/items`, {
      method: 'POST',
      headers: await getHeaders(true),
      body: JSON.stringify(itemData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error al agregar item al pedido ${pedidoId}:`, error);
    throw error;
  }
};

// Actualizar estado de un pedido
export const actualizarEstadoPedido = async (pedidoId, estado, notas) => {
  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/estado`, {
      method: 'PUT',
      headers: await getHeaders(true),
      body: JSON.stringify({ estado, notas })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error al actualizar estado del pedido ${pedidoId}:`, error);
    throw error;
  }
};

// Procesar pago de un pedido
export const procesarPago = async (pedidoId, pagoData) => {
  try {
    const response = await fetch(`${API_URL}/pedidos/${pedidoId}/pago`, {
      method: 'POST',
      headers: await getHeaders(true),
      body: JSON.stringify(pagoData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error al procesar pago del pedido ${pedidoId}:`, error);
    throw error;
  }
};