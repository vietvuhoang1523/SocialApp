import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hook/ThemeContext';
import { createReport } from '../services/reportService';

const reportReasons = [
  { id: 'INAPPROPRIATE_CONTENT', label: 'Nội dung không phù hợp' },
  { id: 'HARASSMENT', label: 'Quấy rối/Bắt nạt' },
  { id: 'SPAM', label: 'Spam' },
  { id: 'FALSE_INFORMATION', label: 'Thông tin sai sự thật' },
  { id: 'VIOLENCE', label: 'Bạo lực' },
  { id: 'HATE_SPEECH', label: 'Phát ngôn thù ghét' },
  { id: 'INTELLECTUAL_PROPERTY', label: 'Vi phạm bản quyền' },
  { id: 'SCAM', label: 'Lừa đảo' },
  { id: 'OTHER', label: 'Khác' }
];

const ReportScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { reportType, targetId, targetName } = route.params;
  
  const [selectedReason, setSelectedReason] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Submit report
  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Lỗi', 'Vui lòng chọn lý do báo cáo');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const reportData = {
        reportType,
        targetId,
        reason: selectedReason,
        description
      };
      
      await createReport(reportData);
      
      Alert.alert(
        'Thành công',
        'Báo cáo của bạn đã được gửi và sẽ được xem xét bởi đội ngũ quản trị viên.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Báo cáo
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>
              {getReportTypeText(reportType)}: {targetName || targetId}
            </Text>
          </View>
          
          {/* Report Reasons */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Chọn lý do báo cáo
            </Text>
            
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.id && {
                    backgroundColor: colors.primary + '20',
                  }
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={styles.reasonContent}>
                  <Text style={[styles.reasonText, { color: colors.text }]}>
                    {reason.label}
                  </Text>
                </View>
                
                <View style={[
                  styles.radioButton,
                  selectedReason === reason.id
                    ? { borderColor: colors.primary, backgroundColor: colors.primary }
                    : { borderColor: colors.border }
                ]}>
                  {selectedReason === reason.id && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Description */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mô tả chi tiết
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="Mô tả chi tiết về vấn đề bạn đang gặp phải..."
              placeholderTextColor={colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          
          {/* Guidelines */}
          <View style={[styles.guidelineContainer, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.guidelineText, { color: colors.textLight }]}>
              Báo cáo của bạn sẽ được gửi đến đội ngũ quản trị viên để xem xét. Chúng tôi sẽ thực hiện các biện pháp thích hợp dựa trên nội dung báo cáo.
            </Text>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: submitting ? colors.primary + '80' : colors.primary }
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
            )}
          </TouchableOpacity>
          
          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Hủy
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

// Helper function to get report type text
const getReportTypeText = (reportType) => {
  switch (reportType) {
    case 'USER':
      return 'Người dùng';
    case 'POST':
      return 'Bài viết';
    case 'COMMENT':
      return 'Bình luận';
    case 'SPORTS_POST':
      return 'Bài đăng thể thao';
    case 'SPORTS_VENUE':
      return 'Địa điểm thể thao';
    case 'WORKOUT':
      return 'Buổi tập';
    case 'MESSAGE':
      return 'Tin nhắn';
    default:
      return 'Nội dung';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonContent: {
    flex: 1,
  },
  reasonText: {
    fontSize: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  guidelineContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  guidelineText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ReportScreen; 