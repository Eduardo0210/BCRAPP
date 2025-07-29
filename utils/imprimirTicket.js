// utils/imprimirTicket.js
import TcpSocket from 'react-native-tcp-socket';
import { Alert } from 'react-native';
import { Buffer } from 'buffer';



export const imprimirTicketTexto = async (textoTicket) => {

    // Reemplaza acentos por caracteres ASCII básicos
const limpiarAcentos = (texto) => {
    return texto
      .replace(/á/g, 'a').replace(/Á/g, 'A')
      .replace(/é/g, 'e').replace(/É/g, 'E')
      .replace(/í/g, 'i').replace(/Í/g, 'I')
      .replace(/ó/g, 'o').replace(/Ó/g, 'O')
      .replace(/ú/g, 'u').replace(/Ú/g, 'U')
      .replace(/ñ/g, 'n').replace(/Ñ/g, 'N');
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.log("Tiempo de seguridad agotado");
      if (client) {
        client.destroy();
      }
      reject(new Error("Operación cancelada por tiempo de seguridad"));
    }, 500);

    let client = null;

    try {
      client = TcpSocket.createConnection(
        { port: 9100, host: '192.168.100.114', timeout: 2000 },
        () => {
          console.log("Conectado, enviando ticket...");
          const textoLimpio = limpiarAcentos(textoTicket).replace(/\r/g, '');
          console.log('Texto que se va a imprimir:\n' + textoLimpio);

          const buffer = Buffer.from(textoLimpio.replace(/\r/g, ''), 'ascii');
          const success = client.write(buffer, (err) => {
            if (err) {
              console.error("Error al escribir:", err);
              clearTimeout(timeoutId);
              client.destroy();
              reject(err);
              return;
            }

            console.log("Datos enviados, cerrando conexión...");

            try {
              client.end();
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
