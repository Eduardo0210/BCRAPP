import SQL from 'react-native-mssql';
import { dbConfig } from './config';

console.log('Verificando SQL:', SQL);

export const connectToDatabase = async () => {
  if (!SQL) {
    console.error('❌ Error: La variable SQL es null o undefined');
    return false;
  }

  console.log('Conectando a la base de datos...', dbConfig);
  try {
    await SQL.connect(dbConfig);
    console.log('✅ Conexión exitosa a SQL Server');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con SQL Server:', error);
    return false;
  }
};
