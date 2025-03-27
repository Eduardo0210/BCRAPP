
// db/config.js - Configuración de la conexión
export const dbConfig = {
    server: 'ec2-3-128-113-3.us-east-2.compute.amazonaws.com',  // Dirección del servidor SQL
    database: 'CRDB',     // Nombre de la base de datos
    user: 'quepharma',             // Usuario
    password: 'Quepharma.2022',      // Contraseña
    port: 3005,                     // Puerto (por defecto 1433)
    trustServerCertificate: false    // Para desarrollo local
  };