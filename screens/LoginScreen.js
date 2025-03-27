import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { login, verificarSesion } from '../api/services';

const LoginScreen = ({ navigation }) => {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Verificar si hay sesión activa al cargar
  useEffect(() => {
    const verificarAuth = async () => {
      try {
        const sesion = await verificarSesion();
        if (sesion) {
          // Si hay sesión activa, navegar directamente a Home
          navigation.replace('Home');
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
      } finally {
        setVerificando(false);
      }
    };

    verificarAuth();
  }, [navigation]);

  // Manejar inicio de sesión
  const handleLogin = async () => {
    // Validar campos
    if (!usuario || !contraseña) {
      Alert.alert('Error', 'Por favor, ingresa usuario y contraseña');
      return;
    }

    try {
      setCargando(true);
      await login(usuario, contraseña);
      // Navegar a la pantalla principal
      navigation.replace('Home');
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      Alert.alert(
        'Error de autenticación',
        error.message || 'Usuario o contraseña incorrectos'
      );
    } finally {
      setCargando(false);
    }
  };

  // Mostrar indicador de carga mientras se verifica la sesión
  if (verificando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#f8b500" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/birria-logo.png')} // Asegúrate de tener este archivo
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>Birria CR</Text>
          <Text style={styles.appSubtitle}>Gestión de Pedidos</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={contraseña}
            onChangeText={setContraseña}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.loginButton, cargando && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8b500',
  },
  appSubtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#f8b500',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#f8b50080', // Versión semitransparente
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default LoginScreen;