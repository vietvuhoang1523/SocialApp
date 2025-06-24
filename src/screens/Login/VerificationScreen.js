import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import AuthService from '../../services/AuthService';

const VerificationScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [verificationAttempts, setVerificationAttempts] = useState(0);

    // Countdown timer cho việc gửi lại mã
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const validateInputs = () => {
        if (!email || !email.includes('@')) {
            Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
            return false;
        }
        if (!verificationCode || verificationCode.length !== 6) {
            Alert.alert('Lỗi', 'Mã xác thực phải có 6 ký tự');
            return false;
        }
        return true;
    };

    const handleVerify = async () => {
        if (!validateInputs()) return;

        try {
            setIsVerifying(true);
            console.log('Đang xác thực tài khoản với email:', email, 'và mã:', verificationCode);

            const result = await AuthService.verifyAccount(email, verificationCode);
            console.log('Kết quả xác thực:', result);

            Alert.alert(
                'Thành công', 
                'Tài khoản của bạn đã được xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.',
                [
                    {
                        text: 'Đăng nhập ngay',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        } catch (error) {
            console.error('Lỗi xác thực:', error);
            
            setVerificationAttempts(prev => prev + 1);

            let errorMessage = 'Xác thực thất bại. Vui lòng thử lại.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Nếu thử quá 3 lần, hiển thị option gửi lại mã
            if (verificationAttempts >= 2) {
                Alert.alert(
                    'Lỗi xác thực',
                    'Bạn đã nhập sai mã quá nhiều lần. Bạn có muốn gửi lại mã mới không?',
                    [
                        { text: 'Thử lại', style: 'cancel' },
                        {
                            text: 'Gửi lại mã',
                            onPress: handleResendCode
                        }
                    ]
                );
            } else {
                Alert.alert('Lỗi xác thực', errorMessage);
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (!email || !email.includes('@')) {
            Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ trước khi gửi lại mã');
            return;
        }

        if (countdown > 0) {
            Alert.alert('Thông báo', `Vui lòng đợi ${countdown} giây trước khi gửi lại mã`);
            return;
        }

        try {
            setIsVerifying(true);
            console.log('Đang gửi yêu cầu gửi lại mã xác minh cho email:', email);

            const result = await AuthService.resendVerificationCode(email);
            console.log('Kết quả gửi lại mã:', result);

            // Reset mã hiện tại và đếm số lần thử
            setVerificationCode('');
            setVerificationAttempts(0);
            setCountdown(60); // Đặt lại thời gian chờ 60 giây

            Alert.alert('Thành công', 'Mã xác thực mới đã được gửi đến email của bạn');
        } catch (error) {
            console.error('Lỗi gửi lại mã:', error);
            
            let errorMessage = 'Không thể gửi lại mã. Vui lòng thử lại sau.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Lỗi gửi lại mã', errorMessage);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.background}>
                <View style={styles.overlay}>
                    <Text style={styles.title}>Xác thực tài khoản</Text>
                    
                    <Text style={styles.description}>
                        Nhập email và mã xác thực để kích hoạt tài khoản của bạn
                    </Text>

                    <TextInput
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                    />

                    <TextInput
                        placeholder="Nhập mã xác thực (6 số)"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        style={styles.verificationInput}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    {isVerifying ? (
                        <ActivityIndicator size="large" color="#4CAF50" style={styles.button} />
                    ) : (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerify}
                            disabled={isVerifying}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>Xác thực tài khoản</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendLabel}>Chưa nhận được mã?</Text>
                        {countdown > 0 ? (
                            <Text style={styles.countdownText}>
                                Gửi lại mã sau {countdown} giây
                            </Text>
                        ) : (
                            <TouchableOpacity 
                                onPress={handleResendCode}
                                disabled={isVerifying}
                            >
                                <Text style={styles.resendText}>Gửi lại mã</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerText}>Quay lại đăng nhập</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerText}>Đăng ký tài khoản mới</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 20,
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 30,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        color: '#ffffff',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#E0E0E0',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    input: {
        width: '100%',
        padding: 15,
        marginBottom: 15,
        borderRadius: 5,
        backgroundColor: '#ffffff',
        fontSize: 16,
    },
    verificationInput: {
        width: '100%',
        padding: 15,
        marginBottom: 15,
        borderRadius: 5,
        backgroundColor: '#ffffff',
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        width: '100%',
        padding: 15,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resendContainer: {
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    resendLabel: {
        color: '#E0E0E0',
        fontSize: 14,
        marginBottom: 5,
    },
    resendText: {
        color: '#2196F3',
        fontSize: 14,
        fontWeight: 'bold',
    },
    countdownText: {
        color: '#999',
        fontSize: 14,
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

export default VerificationScreen; 