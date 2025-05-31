import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';

const ProfileHeader = ({ navigation, isLoading, handleSubmit }) => {
    return (
        <LinearGradient
            colors={['#E91E63', '#F06292']}
            style={styles.headerGradient}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.7}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <View style={styles.saveButtonContent}>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                            <Text style={styles.saveButtonText}>Lưu</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

export default ProfileHeader;
