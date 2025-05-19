import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    Alert,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Modal
} from 'react-native';
import AuthService from '../../services/AuthService';

const RegisterScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // States cho dialog xác thực
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationAttempts, setVerificationAttempts] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [debugInfo, setDebugInfo] = useState(''); // Thêm state để hiển thị thông tin debug

    // Countdown timer cho việc gửi lại mã
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const validateInputs = () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return false;
        }

        // Email validation using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Lỗi', 'Email không hợp lệ');
            return false;
        }

        // Password strength validation
        if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!validateInputs()) return;

        setIsLoading(true);
        setDebugInfo('Đang gửi yêu cầu đăng ký...');

        try {
            console.log('Đang đăng ký với thông tin:', { fullName, email, password });

            // Improved error handling for registration
            const result = await AuthService.register(fullName, email, password);
            console.log('Kết quả đăng ký:', result);

            setDebugInfo('Đăng ký thành công, hiển thị dialog xác thực...');

            // Hiển thị dialog xác thực
            setShowVerificationDialog(true);
            setCountdown(60); // Đặt thời gian chờ 60 giây để gửi lại mã

        } catch (error) {
            console.error('Chi tiết lỗi đăng ký:', error);

            // More detailed error handling
            let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

            if (error instanceof TypeError) {
                // Network error or type conversion error
                errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
            } else if (error.message) {
                // Use the specific error message if available
                errorMessage = error.message;
            }

            setDebugInfo(`Lỗi đăng ký: ${errorMessage}`);

            Alert.alert(
                'Đăng ký thất bại',
                errorMessage
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã xác thực');
            return;
        }

        setIsVerifying(true);
        setDebugInfo('Đang xác thực tài khoản...');

        try {
            // Gọi API xác thực
            const result = await AuthService.verifyAccount(email, verificationCode);
            console.log('Kết quả xác thực:', result);
            setDebugInfo('Xác thực thành công!');

            // Đóng dialog xác thực
            setShowVerificationDialog(false);

            // Hiển thị thông báo thành công và chuyển đến trang đăng nhập
            Alert.alert(
                'Xác thực thành công',
                'Tài khoản của bạn đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.',
                [
                    {
                        text: 'Đăng nhập',
                        onPress: () => {
                            console.log('Chuyển hướng đến màn hình đăng nhập');
                            navigation.navigate('Login');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Chi tiết lỗi xác thực:', error);
            setDebugInfo(`Lỗi xác thực: ${error.message}`);

            // Tăng số lần thử
            setVerificationAttempts(verificationAttempts + 1);

            // Hiển thị thông báo lỗi
            Alert.alert(
                'Xác thực thất bại',
                error.message || 'Mã xác thực không đúng. Vui lòng thử lại.'
            );

            // Nếu thử quá 3 lần, hiển thị nút gửi lại mã
            if (verificationAttempts >= 2) {
                Alert.alert(
                    'Quá nhiều lần thử',
                    'Bạn đã nhập sai mã quá nhiều lần. Bạn có muốn gửi lại mã mới không?',
                    [
                        {
                            text: 'Huỷ',
                            style: 'cancel'
                        },
                        {
                            text: 'Gửi lại mã',
                            onPress: handleResendCode
                        }
                    ]
                );
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) {
            Alert.alert('Thông báo', `Vui lòng đợi ${countdown} giây trước khi gửi lại mã`);
            return;
        }

        try {
            // Hiển thị trạng thái đang tải
            setIsVerifying(true);
            setDebugInfo('Đang gửi yêu cầu gửi lại mã...');

            console.log('Đang gửi yêu cầu gửi lại mã xác minh cho email:', email);

            // Gọi API gửi lại mã
            const result = await AuthService.resendVerificationCode(email);
            console.log('Kết quả gửi lại mã:', result);
            setDebugInfo('Gửi lại mã thành công!');

            // Reset mã hiện tại và đếm số lần thử
            setVerificationCode('');
            setVerificationAttempts(0);
            setCountdown(60); // Đặt lại thời gian chờ 60 giây

            Alert.alert('Thành công', 'Mã xác thực mới đã được gửi đến email của bạn');
        } catch (error) {
            console.error('Lỗi gửi lại mã:', error);
            setDebugInfo(`Lỗi gửi lại mã: ${error.message}`);

            // Thêm thông tin chi tiết về lỗi
            Alert.alert(
                'Lỗi gửi lại mã',
                `${error.message}\nVui lòng thử lại sau hoặc liên hệ hỗ trợ.`
            );
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.background}>
                <View style={styles.overlay}>
                    <Text style={styles.title}>Đăng ký</Text>

                    <TextInput
                        placeholder="Họ và tên"
                        value={fullName}
                        onChangeText={setFullName}
                        style={styles.input}
                    />

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

                    <TextInput
                        placeholder="Xác nhận mật khẩu"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        style={styles.input}
                    />

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#4CAF50" />
                    ) : (
                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={handleRegister}
                            disabled={isLoading}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.buttonText}>Đăng ký</Text>
                        </TouchableOpacity>
                    )}

                    {/* Hiển thị thông tin debug nếu cần */}
                    {debugInfo ? (
                        <View style={styles.debugContainer}>
                            <Text style={styles.debugText}>{debugInfo}</Text>
                        </View>
                    ) : null}

                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerText}>Đã có tài khoản? Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Dialog xác thực OTP */}
            <Modal
                visible={showVerificationDialog}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    Alert.alert(
                        'Xác nhận',
                        'Bạn cần xác thực tài khoản để có thể đăng nhập. Bạn có chắc muốn huỷ không?',
                        [
                            { text: 'Không', style: 'cancel' },
                            {
                                text: 'Có',
                                onPress: () => setShowVerificationDialog(false),
                                style: 'destructive'
                            }
                        ]
                    );
                }}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Xác thực tài khoản</Text>

                        <Text style={styles.modalText}>
                            Chúng tôi đã gửi mã xác thực đến email {email}.
                            Vui lòng kiểm tra hộp thư (và thư mục spam) và nhập mã xác thực để hoàn tất quá trình đăng ký.
                        </Text>

                        <TextInput
                            placeholder="Nhập mã xác thực"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            style={styles.verificationInput}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        {isVerifying ? (
                            <ActivityIndicator size="large" color="#4CAF50" style={styles.modalButton} />
                        ) : (
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleVerify}
                                disabled={isVerifying}
                            >
                                <Text style={styles.buttonText}>Xác thực</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.resendContainer}>
                            {countdown > 0 ? (
                                <Text style={styles.countdownText}>
                                    Gửi lại mã sau {countdown} giây
                                </Text>
                            ) : (
                                <TouchableOpacity onPress={handleResendCode}>
                                    <Text style={styles.resendText}>Gửi lại mã</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                Alert.alert(
                                    'Xác nhận',
                                    'Bạn cần xác thực tài khoản để có thể đăng nhập. Bạn có chắc muốn huỷ không?',
                                    [
                                        { text: 'Không', style: 'cancel' },
                                        {
                                            text: 'Có',
                                            onPress: () => setShowVerificationDialog(false),
                                            style: 'destructive'
                                        }
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.closeButtonText}>Huỷ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    registerButton: {
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
    debugContainer: {
        marginTop: 15,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 5,
        width: '100%',
    },
    debugText: {
        color: '#FFF',
        fontSize: 12,
    },

    // Styles cho modal xác thực
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    verificationInput: {
        width: '100%',
        padding: 15,
        marginBottom: 15,
        borderRadius: 5,
        backgroundColor: '#f5f5f5',
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    modalButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    resendContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
    resendText: {
        color: '#2196F3',
        fontSize: 14,
    },
    countdownText: {
        color: '#999',
        fontSize: 14,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
    },
    closeButtonText: {
        color: '#F44336',
        fontSize: 14,
    }
});

export default RegisterScreen;
