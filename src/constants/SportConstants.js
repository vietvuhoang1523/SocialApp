export const SportTypeIcons = {
  FOOTBALL: 'futbol',
  BASKETBALL: 'basketball-ball',
  VOLLEYBALL: 'volleyball-ball',
  TENNIS: 'table-tennis',
  BADMINTON: 'baseball-ball', // Using similar icon
  SWIMMING: 'swimmer',
  RUNNING: 'running',
  CYCLING: 'biking',
  YOGA: 'pray',
  GYM: 'dumbbell',
  GOLF: 'golf-ball',
  BOXING: 'fist-raised',
  HIKING: 'hiking',
  BOWLING: 'bowling-ball',
  DANCE: 'shoe-prints',
  SKATING: 'skating',
  CLIMBING: 'mountain',
  FISHING: 'fish',
  OTHER: 'running'
};

export const SportTypeNames = {
  FOOTBALL: 'Bóng đá',
  BASKETBALL: 'Bóng rổ',
  VOLLEYBALL: 'Bóng chuyền',
  TENNIS: 'Tennis',
  BADMINTON: 'Cầu lông',
  SWIMMING: 'Bơi lội',
  RUNNING: 'Chạy bộ',
  CYCLING: 'Đạp xe',
  YOGA: 'Yoga',
  GYM: 'Gym',
  GOLF: 'Golf',
  BOXING: 'Boxing',
  HIKING: 'Leo núi',
  BOWLING: 'Bowling',
  DANCE: 'Nhảy',
  SKATING: 'Trượt patin',
  CLIMBING: 'Leo núi',
  FISHING: 'Câu cá',
  OTHER: 'Khác'
};

export const SkillLevelNames = {
  BEGINNER: 'Mới bắt đầu',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Nâng cao',
  PROFESSIONAL: 'Chuyên nghiệp'
};

export const getDurationText = (minutes) => {
  if (!minutes) return '';
  
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  
  return `${hours} giờ ${remainingMinutes} phút`;
}; 