// screens/ResumenTicketScreen.js
import React from 'react';
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

  // Función para imprimir ticket (esto es un placeholder, la implementación real
  // depende de la impresora que uses)
  const imprimirTicket = async () => {
    const html = `
      <html>
        <body>
          <h2>BIRRIA CR</h2>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Mesa:</strong> ${resumen.numeroMesa}</p>
          <p><strong>Método de Pago:</strong> ${metodoPago}</p>
          <hr />
          <p><strong>Detalle de consumo:</strong></p>
          ${resumen.items.map(item => `
            <p>${item.cantidad}x ${item.nombre} - $${item.subtotal.toFixed(2)}</p>
          `).join('')}
          <hr />
          <p><strong>Total:</strong> $${resumen.total.toFixed(2)}</p>
          <p>¡Gracias por su visita!</p>
        </body>
      </html>
    `;
  
    const { uri } = await Print.printToFileAsync({ html });
  
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("No se puede compartir el archivo en este dispositivo");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.ticketContainer}>
        <Text style={styles.headerTitle}>BIRRIA CR</Text>
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
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>${resumen.subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA:</Text>
          <Text style={styles.totalValue}>${resumen.iva.toFixed(2)}</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.grandTotalLabel]}>TOTAL:</Text>
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