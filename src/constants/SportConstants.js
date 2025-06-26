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

// Sport Constants - Matching backend SportType enum exactly
// File: social-matching/src/main/java/com/example/social_matching/Entity/ENUM/SportType.java

export const SportType = {
    // Các môn thể thao phổ biến
    FOOTBALL: { 
        name: 'FOOTBALL', 
        display: 'Bóng đá', 
        icon: 'football', 
        color: '#4CAF50',
        category: 'TEAM',
        requiresPartner: true
    },
    BASKETBALL: { 
        name: 'BASKETBALL', 
        display: 'Bóng rổ', 
        icon: 'basketball', 
        color: '#FF9800',
        category: 'TEAM',
        requiresPartner: true
    },
    VOLLEYBALL: { 
        name: 'VOLLEYBALL', 
        display: 'Bóng chuyền', 
        icon: 'american-football', 
        color: '#9C27B0',
        category: 'TEAM',
        requiresPartner: true
    },
    TENNIS: { 
        name: 'TENNIS', 
        display: 'Quần vợt', 
        icon: 'tennisball', 
        color: '#8BC34A',
        category: 'RACQUET',
        requiresPartner: true
    },
    BADMINTON: { 
        name: 'BADMINTON', 
        display: 'Cầu lông', 
        icon: 'fitness', 
        color: '#2196F3',
        category: 'RACQUET',
        requiresPartner: true
    },
    PING_PONG: { 
        name: 'PING_PONG', 
        display: 'Bóng bàn', 
        icon: 'baseball', 
        color: '#FF7043',
        category: 'RACQUET',
        requiresPartner: true
    },
    
    // Các môn thể thao cá nhân
    SWIMMING: { 
        name: 'SWIMMING', 
        display: 'Bơi lội', 
        icon: 'water', 
        color: '#00BCD4',
        category: 'WATER',
        requiresPartner: false
    },
    RUNNING: { 
        name: 'RUNNING', 
        display: 'Chạy bộ', 
        icon: 'walk', 
        color: '#FF5722',
        category: 'ATHLETIC',
        requiresPartner: false
    },
    CYCLING: { 
        name: 'CYCLING', 
        display: 'Đạp xe', 
        icon: 'bicycle', 
        color: '#795548',
        category: 'ATHLETIC',
        requiresPartner: false
    },
    GYM: { 
        name: 'GYM', 
        display: 'Tập gym', 
        icon: 'barbell', 
        color: '#607D8B',
        category: 'FITNESS',
        requiresPartner: false
    },
    
    // Các môn thể thao đối kháng
    BOXING: { 
        name: 'BOXING', 
        display: 'Boxing', 
        icon: 'fitness', 
        color: '#E53935',
        category: 'COMBAT',
        requiresPartner: true
    },
    KARATE: { 
        name: 'KARATE', 
        display: 'Karate', 
        icon: 'hand-left', 
        color: '#D32F2F',
        category: 'COMBAT',
        requiresPartner: true
    },
    TAEKWONDO: { 
        name: 'TAEKWONDO', 
        display: 'Taekwondo', 
        icon: 'hand-right', 
        color: '#C62828',
        category: 'COMBAT',
        requiresPartner: true
    },
    
    // Các môn thể thao nước
    SURFING: { 
        name: 'SURFING', 
        display: 'Lướt sóng', 
        icon: 'boat', 
        color: '#0097A7',
        category: 'WATER',
        requiresPartner: false
    },
    SAILING: { 
        name: 'SAILING', 
        display: 'Thuyền buồm', 
        icon: 'boat', 
        color: '#00838F',
        category: 'WATER',
        requiresPartner: true
    },
    
    // Các môn thể thao mạo hiểm
    ROCK_CLIMBING: { 
        name: 'ROCK_CLIMBING', 
        display: 'Leo núi', 
        icon: 'trail-sign', 
        color: '#5D4037',
        category: 'ADVENTURE',
        requiresPartner: true
    },
    SKATEBOARDING: { 
        name: 'SKATEBOARDING', 
        display: 'Trượt ván', 
        icon: 'logo-github', 
        color: '#424242',
        category: 'ADVENTURE',
        requiresPartner: false
    },
    
    // Các môn thể thao trí óc
    CHESS: { 
        name: 'CHESS', 
        display: 'Cờ vua', 
        icon: 'grid', 
        color: '#3E2723',
        category: 'MIND',
        requiresPartner: true
    },
    BILLIARDS: { 
        name: 'BILLIARDS', 
        display: 'Billiards', 
        icon: 'radio-button-off', 
        color: '#1B5E20',
        category: 'MIND',
        requiresPartner: true
    },
    
    // Các môn yoga và thiền
    YOGA: { 
        name: 'YOGA', 
        display: 'Yoga', 
        icon: 'leaf', 
        color: '#4CAF50',
        category: 'WELLNESS',
        requiresPartner: false
    },
    MEDITATION: { 
        name: 'MEDITATION', 
        display: 'Thiền', 
        icon: 'flower', 
        color: '#8BC34A',
        category: 'WELLNESS',
        requiresPartner: false
    },
    
    // Các môn khác
    OTHER: { 
        name: 'OTHER', 
        display: 'Khác', 
        icon: 'ellipsis-horizontal', 
        color: '#9E9E9E',
        category: 'OTHER',
        requiresPartner: false
    }
};

// Sport Categories mapping
export const SportCategory = {
    TEAM: { name: 'TEAM', display: 'Thể thao đồng đội', color: '#4CAF50' },
    RACQUET: { name: 'RACQUET', display: 'Thể thao vợt', color: '#2196F3' },
    ATHLETIC: { name: 'ATHLETIC', display: 'Thể thao điền kinh', color: '#FF9800' },
    COMBAT: { name: 'COMBAT', display: 'Thể thao đối kháng', color: '#F44336' },
    WATER: { name: 'WATER', display: 'Thể thao dưới nước', color: '#00BCD4' },
    ADVENTURE: { name: 'ADVENTURE', display: 'Thể thao mạo hiểm', color: '#795548' },
    MIND: { name: 'MIND', display: 'Thể thao trí óc', color: '#9C27B0' },
    FITNESS: { name: 'FITNESS', display: 'Thể thao rèn luyện', color: '#607D8B' },
    WELLNESS: { name: 'WELLNESS', display: 'Thể thao tinh thần', color: '#8BC34A' },
    OTHER: { name: 'OTHER', display: 'Khác', color: '#9E9E9E' }
};

// Helper functions
export const getSportsByCategory = (category) => {
    return Object.values(SportType).filter(sport => sport.category === category);
};

export const getTeamSports = () => {
    return getSportsByCategory('TEAM');
};

export const getIndividualSports = () => {
    return Object.values(SportType).filter(sport => !sport.requiresPartner);
};

export const getPartnerSports = () => {
    return Object.values(SportType).filter(sport => sport.requiresPartner);
};

export const getPopularSports = () => {
    return [
        SportType.FOOTBALL,
        SportType.BASKETBALL,
        SportType.TENNIS,
        SportType.BADMINTON,
        SportType.SWIMMING,
        SportType.RUNNING,
        SportType.GYM,
        SportType.YOGA
    ];
};

export default SportType; 