// LoginScreen.js (Đã sửa lỗi điều hướng)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../../services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Kiểm tra xem đã đăng nhập chưa khi màn hình được tải
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Kiểm tra xác thực
  // Kiểm tra xác thực
  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');

      // Chỉ kiểm tra khi có token
      if (token) {
        const isAuthenticated = await AuthService.isAuthenticated();
        console.log('Đã đăng nhập:', isAuthenticated);

        if (isAuthenticated) {
          // Đã đăng nhập, chuyển đến màn hình chính
          const availableScreens = ['Home', 'Dashboard', 'Profile'];

          // Tìm màn hình đầu tiên khả dụng trong navigator
          for (const screen of availableScreens) {
            try {
              // Thử chuyển hướng đến màn hình
              navigation.navigate(screen);
              console.log('Đã chuyển hướng đến màn hình:', screen);
              return; // Dừng vòng lặp nếu chuyển hướng thành công
            } catch (navError) {
              console.warn(`Không thể chuyển hướng đến ${screen}, thử màn hình tiếp theo.`);
            }
          }

          // Nếu không thể chuyển hướng đến bất kỳ màn hình nào
          console.error('Không thể tìm thấy màn hình chính khả dụng');
          Alert.alert(
              'Lỗi điều hướng',
              'Không thể tìm thấy màn hình chính. Vui lòng kiểm tra cấu hình của ứng dụng.'
          );
        }
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      // Nếu có lỗi, không tự động chuyển hướng
    } finally {
      setInitialLoading(false);
    }
  };

  // Xử lý đăng nhập
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const response = await AuthService.login(email, password);

      console.log('Đăng nhập thành công:', response);

      // Log token để debug
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Token đã lưu:', token);

      if (!token) {
        throw new Error('Không thể lưu token.');
      }

      // Chuyển đến màn hình chính
      // Thử các màn hình có thể có
      const availableScreens = [ 'Home', 'Dashboard', 'Profile'];
      let navigated = false;

      for (const screen of availableScreens) {
        try {
          // Thử chuyển hướng đến màn hình
          navigation.navigate(screen);
          console.log('Đã chuyển hướng đến màn hình:', screen);
          navigated = true;
          break; // Dừng vòng lặp nếu chuyển hướng thành công
        } catch (navError) {
          console.warn(`Không thể chuyển hướng đến ${screen}, thử màn hình tiếp theo.`);
        }
      }

      if (!navigated) {
        // Nếu không thể chuyển hướng đến bất kỳ màn hình nào
        Alert.alert(
            'Lỗi điều hướng',
            'Không thể tìm thấy màn hình chính. Vui lòng kiểm tra cấu hình của ứng dụng.'
        );
      }
    } catch (error) {
      console.error('Login error', error);
      let errorMessage = 'Không thể đăng nhập. Vui lòng thử lại.';

      if (error.response) {
        // Lỗi từ server
        if (error.response.status === 401) {
          errorMessage = 'Email hoặc mật khẩu không đúng';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      } else {
        // Lỗi khác
        errorMessage = error.message || 'Có lỗi xảy ra khi đăng nhập';
      }

      Alert.alert('Lỗi đăng nhập', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý chuyển đến màn hình đăng ký
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  // Xử lý quên mật khẩu
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  if (initialLoading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang kiểm tra thông tin đăng nhập...</Text>
        </View>
    );
  }

  return (
      <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Logo và tiêu đề */}
          <View style={styles.logoContainer}>
            {/*<Image*/}
            {/*    source={require('../assets/logo.png')}*/}
            {/*    style={styles.logo}*/}
            {/*    resizeMode="contain"*/}
            {/*/>*/}
            <Text style={styles.appTitle}>Social Matching App</Text>
            <Text style={styles.appSubtitle}>Kết nối - Chia sẻ - Kết bạn</Text>
          </View>

          {/* Form đăng nhập */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#757575" style={styles.inputIcon} />
              <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#757575" style={styles.inputIcon} />
              <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
              />
              <TouchableOpacity
                  style={styles.visibilityIcon}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Icon
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={20}
                    color="#757575"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
            >
              {loading ? (
                  <ActivityIndicator size="small" color="white" />
              ) : (
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Phần đăng ký */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>

          {/* Xác thực tài khoản */}
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationText}>Đã đăng ký nhưng chưa xác thực? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Verification')}>
              <Text style={styles.verificationButtonText}>Xác thực ngay</Text>
            </TouchableOpacity>
          </View>

          {/* Hoặc đăng nhập với */}
          <View style={styles.socialLoginContainer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="apple" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: '#F5F5F5',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 10,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  registerText: {
    color: '#757575',
    fontSize: 14,
  },
  registerButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verificationContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  verificationText: {
    color: '#757575',
    fontSize: 14,
  },
  verificationButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  socialLoginContainer: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#9E9E9E',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});

export default LoginScreen;
