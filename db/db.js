import sql from 'mssql';

const config = {
  user: 'quepharma',
  password: 'Quepharma.2022',
  server: 'ec2-3-128-113-3.us-east-2.compute.amazonaws.com',
  database: 'CRDB',
  port: 1433, 
  options: {
    encrypt: false, 
    trustServerCertificate: true
  }
};

export const connectDB = async () => {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Conexión a SQL Server exitosa');
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar:', error);
  }
};
