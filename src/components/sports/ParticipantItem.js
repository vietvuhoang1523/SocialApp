import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hook/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ParticipantItem = ({ participant, onPress, showStatus = false, onApprove, onReject }) => {
  const { colors } = useTheme();
  
  if (!participant) return null;
  
  const { 
    id, 
    user, 
    status, 
    joinMessage, 
    responseMessage, 
    joinedAt, 
    respondedAt 
  } = participant;
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
  };
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'ACCEPTED':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'REJECTED':
        return colors.error;
      default:
        return colors.textLight;
    }
  };
  
  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'ACCEPTED':
        return 'Đã chấp nhận';
      case 'PENDING':
        return 'Đang chờ duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return 'Không xác định';
    }
  };
  
  // Check if this is a pending request that can be approved/rejected
  const isPendingRequest = status === 'PENDING' && onApprove && onReject;
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: colors.cardBackground },
        onPress ? null : styles.noPress
      ]}
      onPress={onPress ? () => onPress(participant) : null}
      disabled={!onPress}
    >
      {/* User avatar */}
      <Image 
        source={user?.avatar ? { uri: user.avatar } : require('../../assets/default-avatar.png')}
        style={styles.avatar}
      />
      
      {/* User info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.fullName || 'Người dùng'}
        </Text>
        
        {showStatus && (
          <View style={styles.statusRow}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor() }
              ]} 
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        )}
        
        {joinMessage && (
          <Text 
            style={[styles.message, { color: colors.textLight }]}
            numberOfLines={2}
          >
            "{joinMessage}"
          </Text>
        )}
        
        {joinedAt && (
          <Text style={[styles.timestamp, { color: colors.textLight }]}>
            Tham gia: {formatDate(joinedAt)}
          </Text>
        )}
      </View>
      
      {/* Action buttons for pending requests */}
      {isPendingRequest && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
            onPress={() => onApprove(id)}
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => onReject(id)}
          >
            <Ionicons name="close" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Chevron icon for pressable items */}
      {onPress && !isPendingRequest && (
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  noPress: {
    elevation: 0,
    shadowOpacity: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ParticipantItem; 