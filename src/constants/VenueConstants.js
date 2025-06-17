/**
 * Constants for sports venues
 */

// Sport type options for filtering
export const sportTypeOptions = [
  { label: 'Bóng đá', value: 'FOOTBALL', icon: 'soccer' },
  { label: 'Bóng rổ', value: 'BASKETBALL', icon: 'basketball' },
  { label: 'Bóng chuyền', value: 'VOLLEYBALL', icon: 'volleyball' },
  { label: 'Quần vợt', value: 'TENNIS', icon: 'tennis' },
  { label: 'Cầu lông', value: 'BADMINTON', icon: 'badminton' },
  { label: 'Bóng bàn', value: 'TABLE_TENNIS', icon: 'table-tennis' },
  { label: 'Bơi lội', value: 'SWIMMING', icon: 'swim' },
  { label: 'Chạy bộ', value: 'RUNNING', icon: 'run' },
  { label: 'Đạp xe', value: 'CYCLING', icon: 'bike' },
  { label: 'Tập gym', value: 'GYM', icon: 'weight-lifter' },
  { label: 'Yoga', value: 'YOGA', icon: 'yoga' },
  { label: 'Võ thuật', value: 'MARTIAL_ARTS', icon: 'karate' },
  { label: 'Khác', value: 'OTHER', icon: 'dumbbell' }
];

// Venue type options for filtering
export const venueTypeOptions = [
  { label: 'Sân vận động', value: 'STADIUM', icon: 'stadium' },
  { label: 'Sân trong nhà', value: 'INDOOR_COURT', icon: 'home' },
  { label: 'Sân ngoài trời', value: 'OUTDOOR_COURT', icon: 'tree' },
  { label: 'Hồ bơi', value: 'SWIMMING_POOL', icon: 'pool' },
  { label: 'Phòng tập gym', value: 'GYM', icon: 'fitness-center' },
  { label: 'Phòng tập đa năng', value: 'MULTIPURPOSE', icon: 'category' },
  { label: 'Công viên', value: 'PARK', icon: 'park' },
  { label: 'Đường chạy', value: 'RUNNING_TRACK', icon: 'directions-run' },
  { label: 'Khác', value: 'OTHER', icon: 'place' }
];

// Price range options for filtering
export const priceRangeOptions = [
  { label: 'Miễn phí', value: 'FREE' },
  { label: 'Giá rẻ', value: 'LOW' },
  { label: 'Trung bình', value: 'MEDIUM' },
  { label: 'Cao cấp', value: 'HIGH' }
];

// Venue features
export const venueFeatures = [
  { label: 'Có chỗ đỗ xe', value: 'PARKING', icon: 'local-parking' },
  { label: 'Phòng thay đồ', value: 'CHANGING_ROOM', icon: 'checkroom' },
  { label: 'Nhà vệ sinh', value: 'TOILET', icon: 'wc' },
  { label: 'Wifi miễn phí', value: 'FREE_WIFI', icon: 'wifi' },
  { label: 'Đèn chiếu sáng', value: 'LIGHTING', icon: 'lightbulb' },
  { label: 'Dịch vụ ăn uống', value: 'FOOD_SERVICE', icon: 'restaurant' },
  { label: 'Cho thuê dụng cụ', value: 'EQUIPMENT_RENTAL', icon: 'sports' },
  { label: 'Có máy lạnh', value: 'AIR_CONDITIONING', icon: 'ac-unit' },
  { label: 'Có huấn luyện viên', value: 'COACH_AVAILABLE', icon: 'person' },
  { label: 'Có vòi tắm', value: 'SHOWER', icon: 'shower' }
];

// Opening hours template
export const openingHoursTemplate = {
  MONDAY: { open: '07:00', close: '22:00' },
  TUESDAY: { open: '07:00', close: '22:00' },
  WEDNESDAY: { open: '07:00', close: '22:00' },
  THURSDAY: { open: '07:00', close: '22:00' },
  FRIDAY: { open: '07:00', close: '22:00' },
  SATURDAY: { open: '07:00', close: '22:00' },
  SUNDAY: { open: '07:00', close: '22:00' }
};

// Days of week
export const daysOfWeek = [
  { value: 'MONDAY', label: 'Thứ 2' },
  { value: 'TUESDAY', label: 'Thứ 3' },
  { value: 'WEDNESDAY', label: 'Thứ 4' },
  { value: 'THURSDAY', label: 'Thứ 5' },
  { value: 'FRIDAY', label: 'Thứ 6' },
  { value: 'SATURDAY', label: 'Thứ 7' },
  { value: 'SUNDAY', label: 'Chủ nhật' }
];

// Default venue image
export const DEFAULT_VENUE_IMAGE = require('../assets/default-venue.jpg');

export default {
  sportTypeOptions,
  venueTypeOptions,
  priceRangeOptions,
  venueFeatures,
  openingHoursTemplate,
  daysOfWeek,
  DEFAULT_VENUE_IMAGE
}; 