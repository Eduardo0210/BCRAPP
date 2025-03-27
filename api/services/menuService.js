// api/services/menuService.js
import { getApiUrl, getHeaders } from '../config';

const API_URL = getApiUrl();

// Obtener todos los elementos del menú
export const getMenu = async () => {
  try {
    const response = await fetch(`${API_URL}/menu`, {
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
    console.error('Error al obtener el menú:', error);
    throw error;
  }
};

// Obtener todas las categorías
export const getCategorias = async () => {
  try {
    const response = await fetch(`${API_URL}/menu/categorias`, {
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
    console.error('Error al obtener las categorías:', error);
    throw error;
  }
};

// Obtener elementos del menú por categoría
export const getMenuPorCategoria = async (categoriaId) => {
  try {
    const response = await fetch(`${API_URL}/menu/categoria/${categoriaId}`, {
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
    console.error(`Error al obtener menú por categoría ${categoriaId}:`, error);
    throw error;
  }
};