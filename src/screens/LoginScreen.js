import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import AuthService from '../services/AuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt to log in
      const data = await AuthService.login(email, password);

      // Kiểm tra và điều hướng
      if (data.user && data.user.roles) {
        const userRole = data.user.roles[0]?.name;
        if (userRole === 'USERS') {
          // Điều hướng đến màn hình chính
          navigation.reset({
            index: 0,
            routes: [{ name: 'home' }],
          });
        } else {
          Alert.alert('Lỗi', 'Bạn không có quyền truy cập');
        }
      } else {
        Alert.alert('Lỗi', 'Không thể xác định vai trò người dùng');
      }
    } catch (error) {
      // Xử lý lỗi đăng nhập
      Alert.alert(
          'Đăng nhập thất bại',
          error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <View style={styles.background}>
        <View style={styles.overlay}>
          <Text style={styles.title}>Đăng nhập</Text>

          <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
          />
          <TextInput
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
          />

          {isLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
              <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={isLoading}
              >
                <Text style={styles.buttonText}>Đăng nhập</Text>
              </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.footerText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerText}>Chưa có tài khoản? Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 30,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: '#42A5F5',
    fontSize: 14,
    marginVertical: 5,
  },
});

export default LoginScreen;
