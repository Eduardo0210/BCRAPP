// screens/ResumenTicketScreen.js
import React from 'react';
import TcpSocket from 'react-native-tcp-socket';
import { Alert } from 'react-native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';


const ResumenTicketScreen = ({ route, navigation }) => {
  const { resumen, mesaId, metodoPago } = route.params;

 
  const imprimirTicket = async () => {
    const textoTicket = `
    LA BIRRIA LA CRUDA REALIDAD
    N.I.F.: B1234567
    Manzana 019, Adolfo Lopez Mateos
    Cuautitlán Izcalli, Méx.
    CP: 54769
    TELEFONO: 5590489245
    
    PRE-TICKET
    ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    LE ATENDIÓ: Ventas
    MESASMESA ${resumen.numeroMesa}
    CONTADO
    
    UNID. ARTÍCULO                    PRECIO IMPORTE
    ${resumen.items.map(item => {
      const nombre = item.nombre.length > 20 ? item.nombre.slice(0, 20) : item.nombre;
      const cantidad = item.cantidad.toString().padStart(2, ' ');
      const precio = (item.subtotal / item.cantidad).toFixed(2).padStart(6, ' ');
      const importe = item.subtotal.toFixed(2).padStart(7, ' ');
      return `${cantidad}  ${nombre.padEnd(24)} ${precio} ${importe}`;
    }).join('\n')}
    
    BASE      TIPO      CUOTA      TOTAL
    ${resumen.subtotal.toFixed(2).padStart(7, ' ')}     10       ${(resumen.total - resumen.subtotal).toFixed(2).padStart(4, ' ')}      ${resumen.total.toFixed(2)}
    
    TOTAL: ${resumen.total.toFixed(2)}
    
    *** GRACIAS POR SU VISITA ***
    DOCUMENTO SIN VALIDEZ A EFECTOS FISCALES
    \n\n\n\n\n\n`;
  
    // Función para crear una nueva conexión cada vez
    const conectarEImprimir = () => {
      return new Promise((resolve, reject) => {
        // Usar un temporizador de seguridad global
        const timeoutId = setTimeout(() => {
          console.log("Tiempo de seguridad agotado");
          if (client) {
            client.destroy();
          }
          reject(new Error("Operación cancelada por tiempo de seguridad"));
        }, 5000); // 5 segundos de límite total
        
        let client = null;
        
        try {
          client = TcpSocket.createConnection(
            { port: 9100, host: '192.168.100.114', timeout: 2000 },
            () => {
              console.log("Conectado, enviando ticket...");
              
              // Forzar vaciado del buffer después de escribir
              const success = client.write(textoTicket, 'utf8', (err) => {
                if (err) {
                  console.error("Error al escribir:", err);
                  clearTimeout(timeoutId);
                  client.destroy();
                  reject(err);
                  return;
                }
                
                console.log("Datos enviados, cerrando conexión...");
                
                // Forzar cierre inmediato
                try {
                  client.end();
                  
                  // Forzar desconexión después de un breve tiempo si end() no cierra la conexión
                  setTimeout(() => {
                    if (client) {
                      console.log("Forzando cierre de conexión");
                      client.destroy();
                    }
                  }, 500);
                } catch (e) {
                  console.error("Error al cerrar:", e);
                  client.destroy();
                }
              });
              
              if (!success) {
                console.warn("Buffer lleno, esperando a que se vacíe");
              }
            }
          );
          
          client.on('drain', () => {
            console.log("Buffer vaciado");
          });
  
          client.on('data', (data) => {
            console.log('Respuesta de impresora:', data.toString());
          });
  
          client.on('close', (hadError) => {
            console.log("Conexión cerrada" + (hadError ? " con error" : " correctamente"));
            clearTimeout(timeoutId);
            resolve();
          });
  
          client.on('error', (error) => {
            console.error("Error en conexión:", error);
            clearTimeout(timeoutId);
            if (client) client.destroy();
            reject(error);
          });
  
          client.on('timeout', () => {
            console.warn("Conexión: tiempo de espera agotado");
            clearTimeout(timeoutId);
            if (client) client.destroy();
            reject(new Error("Timeout en conexión"));
          });
        } catch (err) {
          console.error("Excepción al crear conexión:", err);
          clearTimeout(timeoutId);
          if (client) client.destroy();
          reject(err);
        }
      });
    };
  
    try {
      await conectarEImprimir();
      Alert.alert("Éxito", "Ticket enviado a la impresora");
    } catch (err) {
      console.error("Error general:", err);
      Alert.alert("Error", "No se pudo imprimir el ticket");
    }
  };
  
  
  

  return (
    <View style={styles.container}>
      <View style={styles.ticketContainer}>
        <Text style={styles.headerTitle}>BIRRIA CR TEST 1.3</Text>
        <Text style={styles.headerSubtitle}>Ticket de Venta</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha:</Text>
          <Text style={styles.infoValue}>{new Date().toLocaleString()}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mesa:</Text>
          <Text style={styles.infoValue}>{resumen.numeroMesa}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Método de Pago:</Text>
          <Text style={styles.infoValue}>{metodoPago}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>DETALLE DE CONSUMO</Text>
        
        {resumen.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemCantidad}>{item.cantidad}x</Text>
            <Text style={styles.itemNombre}>{item.nombre}</Text>
            <Text style={styles.itemPrecio}>${item.precioUnitario.toFixed(2)}</Text>
            <Text style={styles.itemTotal}>${item.subtotal.toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.grandTotalLabel]}>Total:</Text>
          <Text style={[styles.totalValue, styles.grandTotalValue]}>
            ${resumen.total.toFixed(2)}
          </Text>
        </View>

        
        <View style={styles.divider} />
        
        <Text style={styles.footerText}>¡Gracias por su visita!</Text>
        <Text style={styles.footerSubtext}>Vuelva pronto</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.printButton]} 
          onPress={imprimirTicket}
        >
          <Text style={styles.buttonText}>Imprimir Ticket</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Volver a Mesas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  ticketContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#f8b500',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    flex: 1,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  itemCantidad: {
    width: 30,
    textAlign: 'center',
  },
  itemNombre: {
    flex: 2,
  },
  itemPrecio: {
    width: 60,
    textAlign: 'right',
  },
  itemTotal: {
    width: 60,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    width: 80,
    textAlign: 'right',
  },
  grandTotalLabel: {
    fontSize: 18,
  },
  grandTotalValue: {
    fontSize: 18,
  },
  footerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 20,
  },
  footerSubtext: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  printButton: {
    backgroundColor: '#f8b500',
  },
  backButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ResumenTicketScreen;