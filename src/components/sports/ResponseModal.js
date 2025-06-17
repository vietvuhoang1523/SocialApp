import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useTheme } from '../../hook/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ResponseModal = ({ visible, onClose, onSubmit, type, participant }) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  
  // Reset message when modal opens with new participant
  useEffect(() => {
    if (visible && participant) {
      setMessage('');
    }
  }, [visible, participant]);
  
  if (!participant) return null;
  
  const isApprove = type === 'approve';
  const title = isApprove ? 'Chấp nhận yêu cầu' : 'Từ chối yêu cầu';
  const buttonText = isApprove ? 'Chấp nhận' : 'Từ chối';
  const buttonColor = isApprove ? colors.success : colors.error;
  
  const handleSubmit = () => {
    onSubmit(message);
    setMessage('');
  };
  
  const handleClose = () => {
    setMessage('');
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                  </Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                {/* Participant info */}
                <View style={styles.participantInfo}>
                  <Image 
                    source={participant.user?.avatar 
                      ? { uri: participant.user.avatar } 
                      : require('../../assets/default-avatar.png')
                    }
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {participant.user?.fullName || 'Người dùng'}
                    </Text>
                    {participant.joinMessage && (
                      <Text style={[styles.joinMessage, { color: colors.textLight }]}>
                        "{participant.joinMessage}"
                      </Text>
                    )}
                  </View>
                </View>
                
                <Text style={[styles.description, { color: colors.textLight }]}>
                  {isApprove 
                    ? 'Gửi tin nhắn phản hồi (không bắt buộc):'
                    : 'Vui lòng cho biết lý do từ chối (không bắt buộc):'}
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder={isApprove 
                    ? "Nhập tin nhắn phản hồi..." 
                    : "Nhập lý do từ chối..."
                  }
                  placeholderTextColor={colors.textLight}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                    onPress={handleClose}
                  >
                    <Text style={{ color: colors.text }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton, { backgroundColor: buttonColor }]}
                    onPress={handleSubmit}
                  >
                    <Text style={{ color: 'white' }}>{buttonText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  joinMessage: {
    fontStyle: 'italic',
    fontSize: 14,
  },
  description: {
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
  },
});

export default ResponseModal; 