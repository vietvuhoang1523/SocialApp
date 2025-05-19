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
import AuthService from '../../services/AuthService';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const validateEmail = () => {
        if (!email) {
            Alert.alert('Lỗi', 'Vui lòng nhập email');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Lỗi', 'Email không hợp lệ');
            return false;
        }

        return true;
    };

    const validateResetForm = () => {
        if (!verificationCode || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return false;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return false;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        return true;
    };

    const handleSendCode = async () => {
        if (!validateEmail()) return;

        setIsLoading(true);

        try {
            // Call send verification code API
            await AuthService.sendPasswordResetCode(email);

            setCodeSent(true);
            Alert.alert(
                'Thành công',
                'Mã xác nhận đã được gửi đến email của bạn'
            );
        } catch (error) {
            Alert.alert(
                'Lỗi',
                error.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!validateResetForm()) return;

        setIsLoading(true);

        try {
            // Use the corrected method name resetPassword
            await AuthService.resetPassword(email, verificationCode, newPassword);

            Alert.alert(
                'Thành công',
                'Mật khẩu của bạn đã được đặt lại thành công',
                [
                    {
                        text: 'Đăng nhập',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        } catch (error) {
            Alert.alert(
                'Lỗi',
                error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.background}>
            <View style={styles.overlay}>
                <Text style={styles.title}>Quên mật khẩu</Text>

                {!codeSent ? (
                    // Step 1: Send verification code
                    <>
                        <TextInput
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                        />

                        {isLoading ? (
                            <ActivityIndicator size="large" color="#4CAF50" />
                        ) : (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleSendCode}
                                disabled={isLoading}
                            >
                                <Text style={styles.buttonText}>Gửi mã xác nhận</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    // Step 2: Reset password with verification code
                    <>
                        <TextInput
                            placeholder="Mã xác nhận"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            style={styles.input}
                        />

                        <TextInput
                            placeholder="Mật khẩu mới"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            style={styles.input}
                        />

                        <TextInput
                            placeholder="Xác nhận mật khẩu mới"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            style={styles.input}
                        />

                        {isLoading ? (
                            <ActivityIndicator size="large" color="#4CAF50" />
                        ) : (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleResetPassword}
                                disabled={isLoading}
                            >
                                <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerText}>Quay lại đăng nhập</Text>
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
    actionButton: {
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

export default ForgotPasswordScreen;
