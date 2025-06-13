import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hook/ThemeContext';

const EmptyState = ({ 
  icon = 'info-outline', 
  title = 'Không có dữ liệu', 
  message = 'Hiện tại không có dữ liệu nào', 
  actionText, 
  onAction 
}) => {
  const { colors } = useTheme();
  
  const renderIcon = () => {
    if (icon === 'sports') {
      return (
        <MaterialCommunityIcons 
          name="handball" 
          size={80} 
          color={colors.primary + '80'} 
        />
      );
    }
    
    return (
      <MaterialIcons 
        name={icon} 
        size={80} 
        color={colors.primary + '80'} 
      />
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderIcon()}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textLight }]}>{message}</Text>
        
        {actionText && onAction && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onAction}
          >
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 300,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EmptyState; 