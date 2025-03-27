// Instalación de dependencias necesarias:
// npm install react-native-mssql
// o
// npm install react-native-sqlcipher

  
  
  // db/queries.js - Funciones para interactuar con la base de datos
  import SQL from 'react-native-mssql';
  import { connectToDatabase, closeConnection } from './connection';
  
  // Obtener todas las mesas
  export const getMesas = async () => {
    try {
      await connectToDatabase();
      
      const result = await SQL.executeStoredProcedure('sp_ObtenerMesas');
      
      // Transformar los datos para que coincidan con la estructura de tu app
      const mesas = result.map(mesa => ({
        id: mesa.MesaID,
        numero: mesa.Numero,
        capacidad: mesa.Capacidad,
        ubicacion: mesa.Ubicacion,
        esParaLlevar: mesa.EsParaLlevar === 1,
        estado: mesa.Estado,
        ocupada: mesa.Estado === 'Ocupada',
        pedidosActivos: mesa.PedidosActivos || 0
      }));
      
      await closeConnection();
      return mesas;
    } catch (error) {
      console.error('Error al obtener las mesas:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Obtener el menú completo
  export const getMenu = async () => {
    try {
      await connectToDatabase();
      
      const result = await SQL.executeStoredProcedure('sp_ObtenerMenu');
      
      // Transformar los datos para que coincidan con la estructura de tu app
      const menuItems = result.map(item => ({
        id: item.MenuItemID,
        nombre: item.Nombre,
        descripcion: item.Descripcion,
        precio: item.Precio,
        categoria: item.Categoria,
        categoriaId: item.CategoriaID,
        imagenURL: item.ImagenURL
      }));
      
      await closeConnection();
      return menuItems;
    } catch (error) {
      console.error('Error al obtener el menú:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Crear un nuevo pedido
  export const crearPedido = async (pedidoData) => {
    try {
      await connectToDatabase();
      
      const params = [
        { name: 'MesaID', type: 'Int', value: pedidoData.mesaId },
        { name: 'EmpleadoID', type: 'Int', value: pedidoData.empleadoId || null },
        { name: 'Notas', type: 'NVarChar', value: pedidoData.notas || null },
        { name: 'EsParaLlevar', type: 'Bit', value: pedidoData.esParaLlevar ? 1 : 0 },
        { name: 'NombreCliente', type: 'NVarChar', value: pedidoData.nombreCliente || null },
        { name: 'TelefonoCliente', type: 'NVarChar', value: pedidoData.telefonoCliente || null },
        { name: 'PedidoID', type: 'Int', value: 0, isOutput: true }
      ];
      
      const result = await SQL.executeStoredProcedure('sp_CrearPedido', params);
      
      // Obtener el ID del pedido generado
      const pedidoId = result.output.PedidoID;
      
      // Agregar los items al pedido
      if (pedidoData.items && pedidoData.items.length > 0) {
        for (const item of pedidoData.items) {
          await agregarItemPedido({
            pedidoId: pedidoId,
            menuItemId: item.item.id,
            cantidad: item.cantidad,
            notas: item.notas
          });
        }
      }
      
      await closeConnection();
      return pedidoId;
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Agregar un item a un pedido
  export const agregarItemPedido = async (itemData) => {
    try {
      await connectToDatabase();
      
      const params = [
        { name: 'PedidoID', type: 'Int', value: itemData.pedidoId },
        { name: 'MenuItemID', type: 'Int', value: itemData.menuItemId },
        { name: 'Cantidad', type: 'Int', value: itemData.cantidad },
        { name: 'Notas', type: 'NVarChar', value: itemData.notas || null }
      ];
      
      await SQL.executeStoredProcedure('sp_AgregarItemPedido', params);
      
      await closeConnection();
      return true;
    } catch (error) {
      console.error('Error al agregar item al pedido:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Obtener los detalles de un pedido
  export const obtenerPedido = async (pedidoId) => {
    try {
      await connectToDatabase();
      
      const params = [
        { name: 'PedidoID', type: 'Int', value: pedidoId }
      ];
      
      const results = await SQL.executeStoredProcedure('sp_ObtenerPedido', params);
      
      // La primera parte contiene la información del pedido
      const pedidoInfo = results[0][0];
      
      // La segunda parte contiene los ítems del pedido
      const pedidoItems = results[1];
      
      // Dar formato a los datos para la app
      const pedido = {
        id: pedidoInfo.PedidoID,
        mesaId: pedidoInfo.MesaID,
        numeroMesa: pedidoInfo.NumeroMesa,
        empleadoId: pedidoInfo.EmpleadoID,
        empleado: pedidoInfo.NombreEmpleado,
        fechaPedido: pedidoInfo.FechaPedido,
        estado: pedidoInfo.Estado,
        total: pedidoInfo.Total,
        notas: pedidoInfo.Notas,
        esParaLlevar: pedidoInfo.EsParaLlevar === 1,
        nombreCliente: pedidoInfo.NombreCliente,
        telefonoCliente: pedidoInfo.TelefonoCliente,
        items: pedidoItems.map(item => ({
          id: item.PedidoItemID,
          menuItemId: item.MenuItemID,
          nombre: item.NombreItem,
          descripcion: item.Descripcion,
          categoria: item.Categoria,
          cantidad: item.Cantidad,
          precioUnitario: item.PrecioUnitario,
          subtotal: item.Subtotal,
          notas: item.Notas,
          estado: item.Estado
        }))
      };
      
      await closeConnection();
      return pedido;
    } catch (error) {
      console.error('Error al obtener el pedido:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Actualizar el estado de un pedido
  export const actualizarEstadoPedido = async (pedidoId, nuevoEstado, empleadoId = null, notas = null) => {
    try {
      await connectToDatabase();
      
      const params = [
        { name: 'PedidoID', type: 'Int', value: pedidoId },
        { name: 'NuevoEstado', type: 'NVarChar', value: nuevoEstado },
        { name: 'EmpleadoID', type: 'Int', value: empleadoId },
        { name: 'Notas', type: 'NVarChar', value: notas }
      ];
      
      await SQL.executeStoredProcedure('sp_ActualizarEstadoPedido', params);
      
      await closeConnection();
      return true;
    } catch (error) {
      console.error('Error al actualizar el estado del pedido:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Procesar el pago de un pedido
  export const procesarPago = async (pagoData) => {
    try {
      await connectToDatabase();
      
      const params = [
        { name: 'PedidoID', type: 'Int', value: pagoData.pedidoId },
        { name: 'Monto', type: 'Decimal', value: pagoData.monto },
        { name: 'MetodoPago', type: 'NVarChar', value: pagoData.metodoPago },
        { name: 'NumeroReferencia', type: 'NVarChar', value: pagoData.numeroReferencia || null },
        { name: 'EmpleadoID', type: 'Int', value: pagoData.empleadoId || null }
      ];
      
      await SQL.executeStoredProcedure('sp_ProcesarPago', params);
      
      await closeConnection();
      return true;
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Obtener los pedidos de una mesa
  export const obtenerPedidosPorMesa = async (mesaId) => {
    try {
      await connectToDatabase();
      
      const params = [
        { name: 'MesaID', type: 'Int', value: mesaId }
      ];
      
      const results = await SQL.executeStoredProcedure('sp_ObtenerPedidosPorMesa', params);
      
      // Dar formato a los datos para la app
      const pedidos = results.map(pedido => ({
        id: pedido.PedidoID,
        fechaPedido: pedido.FechaPedido,
        estado: pedido.Estado,
        total: pedido.Total,
        notas: pedido.Notas,
        numeroItems: pedido.NumeroItems
      }));
      
      await closeConnection();
      return pedidos;
    } catch (error) {
      console.error('Error al obtener los pedidos de la mesa:', error);
      await closeConnection();
      throw error;
    }
  };
  
  // Obtener resumen de ventas por día
  export const obtenerResumenVentas = async (fechaInicio, fechaFin) => {
    try {
      await connectToDatabase();
      
      const params = [
        { name: 'FechaInicio', type: 'Date', value: fechaInicio },
        { name: 'FechaFin', type: 'Date', value: fechaFin }
      ];
      
      const results = await SQL.executeStoredProcedure('sp_ObtenerResumenVentasPorDia', params);
      
      // Dar formato a los datos para la app
      const resumen = results.map(dia => ({
        fecha: dia.Fecha,
        numeroPedidos: dia.NumeroPedidos,
        totalVentas: dia.TotalVentas,
        promedioVentas: dia.PromedioVentas,
        mesasAtendidas: dia.MesasAtendidas
      }));
      
      await closeConnection();
      return resumen;
    } catch (error) {
      console.error('Error al obtener el resumen de ventas:', error);
      await closeConnection();
      throw error;
    }
  };