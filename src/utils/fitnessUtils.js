/**
 * Utility functions for fitness calculations
 */

/**
 * Calculate calories burned based on activity type, intensity, duration, and user weight
 * @param {string} sportType - Type of sport/activity
 * @param {string} intensity - Intensity level (LOW, MEDIUM, HIGH)
 * @param {number} durationMinutes - Duration in minutes
 * @param {number} weightKg - User weight in kg
 * @returns {number} - Calories burned
 */
export const calculateCaloriesBurned = (sportType, intensity, durationMinutes, weightKg) => {
  // MET (Metabolic Equivalent of Task) values for different activities
  // MET is the ratio of working metabolic rate to resting metabolic rate
  const metValues = {
    RUNNING: {
      LOW: 8.0,     // Jogging, light pace
      MEDIUM: 11.0, // Running, moderate pace
      HIGH: 16.0    // Running, fast pace
    },
    CYCLING: {
      LOW: 4.0,     // Cycling, light effort
      MEDIUM: 8.0,  // Cycling, moderate effort
      HIGH: 14.0    // Cycling, vigorous effort
    },
    WALKING: {
      LOW: 2.5,     // Walking, slow pace
      MEDIUM: 3.5,  // Walking, moderate pace
      HIGH: 5.0     // Walking, brisk pace
    },
    SWIMMING: {
      LOW: 5.0,     // Swimming, light effort
      MEDIUM: 8.0,  // Swimming, moderate effort
      HIGH: 11.0    // Swimming, vigorous effort
    },
    HIKING: {
      LOW: 4.0,     // Hiking, light effort
      MEDIUM: 6.0,  // Hiking, moderate effort
      HIGH: 8.0     // Hiking, vigorous effort
    },
    YOGA: {
      LOW: 2.5,     // Yoga, light effort
      MEDIUM: 3.5,  // Yoga, moderate effort
      HIGH: 4.5     // Yoga, vigorous effort
    },
    GYM: {
      LOW: 3.5,     // Weight lifting, light effort
      MEDIUM: 5.0,  // Weight lifting, moderate effort
      HIGH: 6.5     // Weight lifting, vigorous effort
    },
    OTHER: {
      LOW: 3.0,     // General light activity
      MEDIUM: 5.0,  // General moderate activity
      HIGH: 8.0     // General vigorous activity
    }
  };

  // Get MET value for the activity and intensity
  const activityMet = metValues[sportType]?.[intensity] || metValues.OTHER[intensity];
  
  // Calculate calories burned using the formula:
  // Calories = MET × weight (kg) × duration (hours)
  // 1 MET = 1 kcal/kg/hour
  const durationHours = durationMinutes / 60;
  const caloriesBurned = activityMet * weightKg * durationHours;
  
  return caloriesBurned;
};

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weightKg - Weight in kg
 * @param {number} heightCm - Height in cm
 * @returns {number} - BMI value
 */
export const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || heightCm === 0) {
    return 0;
  }
  
  // Convert height from cm to m
  const heightM = heightCm / 100;
  
  // BMI = weight (kg) / (height (m))²
  return weightKg / (heightM * heightM);
};

/**
 * Get BMI category based on BMI value
 * @param {number} bmi - BMI value
 * @returns {string} - BMI category
 */
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) {
    return 'Thiếu cân';
  } else if (bmi < 25) {
    return 'Bình thường';
  } else if (bmi < 30) {
    return 'Thừa cân';
  } else {
    return 'Béo phì';
  }
};

/**
 * Calculate daily calorie needs based on Harris-Benedict equation
 * @param {number} weightKg - Weight in kg
 * @param {number} heightCm - Height in cm
 * @param {number} ageYears - Age in years
 * @param {string} gender - 'male' or 'female'
 * @param {string} activityLevel - Activity level (sedentary, light, moderate, active, very)
 * @returns {number} - Daily calorie needs
 */
export const calculateDailyCalorieNeeds = (weightKg, heightCm, ageYears, gender, activityLevel) => {
  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2,    // Little or no exercise
    light: 1.375,      // Light exercise 1-3 days/week
    moderate: 1.55,    // Moderate exercise 3-5 days/week
    active: 1.725,     // Heavy exercise 6-7 days/week
    very: 1.9          // Very heavy exercise, physical job or training twice a day
  };
  
  // Calculate BMR (Basal Metabolic Rate) using Harris-Benedict equation
  let bmr;
  if (gender.toLowerCase() === 'male') {
    bmr = 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears);
  } else {
    bmr = 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears);
  }
  
  // Get activity multiplier
  const multiplier = activityMultipliers[activityLevel] || activityMultipliers.moderate;
  
  // Calculate daily calorie needs
  return bmr * multiplier;
};

/**
 * Calculate maximum heart rate
 * @param {number} ageYears - Age in years
 * @returns {number} - Maximum heart rate
 */
export const calculateMaxHeartRate = (ageYears) => {
  // Maximum heart rate formula: 220 - age
  return 220 - ageYears;
};

/**
 * Calculate heart rate zones
 * @param {number} maxHeartRate - Maximum heart rate
 * @returns {Object} - Heart rate zones
 */
export const calculateHeartRateZones = (maxHeartRate) => {
  return {
    zone1: {
      name: 'Rất nhẹ',
      min: Math.round(maxHeartRate * 0.5),
      max: Math.round(maxHeartRate * 0.6)
    },
    zone2: {
      name: 'Nhẹ',
      min: Math.round(maxHeartRate * 0.6),
      max: Math.round(maxHeartRate * 0.7)
    },
    zone3: {
      name: 'Vừa phải',
      min: Math.round(maxHeartRate * 0.7),
      max: Math.round(maxHeartRate * 0.8)
    },
    zone4: {
      name: 'Nặng',
      min: Math.round(maxHeartRate * 0.8),
      max: Math.round(maxHeartRate * 0.9)
    },
    zone5: {
      name: 'Tối đa',
      min: Math.round(maxHeartRate * 0.9),
      max: maxHeartRate
    }
  };
};

/**
 * Calculate pace from distance and duration
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} durationSeconds - Duration in seconds
 * @returns {string} - Pace in format "MM:SS /km"
 */
export const calculatePace = (distanceKm, durationSeconds) => {
  if (!distanceKm || distanceKm === 0) {
    return '00:00 /km';
  }
  
  // Calculate pace in seconds per kilometer
  const paceSeconds = durationSeconds / distanceKm;
  
  // Convert to minutes and seconds
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  
  // Format as MM:SS
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} /km`;
};

/**
 * Calculate average speed from distance and duration
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} durationSeconds - Duration in seconds
 * @returns {number} - Speed in km/h
 */
export const calculateSpeed = (distanceKm, durationSeconds) => {
  if (!durationSeconds || durationSeconds === 0) {
    return 0;
  }
  
  // Convert duration to hours
  const durationHours = durationSeconds / 3600;
  
  // Calculate speed in km/h
  return distanceKm / durationHours;
};

/**
 * Calculate VO2 Max using Cooper test formula
 * @param {number} distanceKm - Distance covered in 12 minutes (in kilometers)
 * @returns {number} - VO2 Max in ml/kg/min
 */
export const calculateVO2Max = (distanceKm) => {
  // Cooper test formula: VO2 Max = (distance in meters - 504.9) / 44.73
  const distanceMeters = distanceKm * 1000;
  return (distanceMeters - 504.9) / 44.73;
};

/**
 * Get fitness level based on VO2 Max value
 * @param {number} vo2Max - VO2 Max value
 * @param {string} gender - 'male' or 'female'
 * @param {number} ageYears - Age in years
 * @returns {string} - Fitness level
 */
export const getFitnessLevel = (vo2Max, gender, ageYears) => {
  // Simplified fitness level categories
  if (gender.toLowerCase() === 'male') {
    if (ageYears < 30) {
      if (vo2Max < 35) return 'Kém';
      if (vo2Max < 42) return 'Trung bình';
      if (vo2Max < 52) return 'Tốt';
      return 'Xuất sắc';
    } else if (ageYears < 40) {
      if (vo2Max < 32) return 'Kém';
      if (vo2Max < 39) return 'Trung bình';
      if (vo2Max < 49) return 'Tốt';
      return 'Xuất sắc';
    } else if (ageYears < 50) {
      if (vo2Max < 30) return 'Kém';
      if (vo2Max < 36) return 'Trung bình';
      if (vo2Max < 45) return 'Tốt';
      return 'Xuất sắc';
    } else {
      if (vo2Max < 25) return 'Kém';
      if (vo2Max < 32) return 'Trung bình';
      if (vo2Max < 40) return 'Tốt';
      return 'Xuất sắc';
    }
  } else {
    if (ageYears < 30) {
      if (vo2Max < 30) return 'Kém';
      if (vo2Max < 36) return 'Trung bình';
      if (vo2Max < 46) return 'Tốt';
      return 'Xuất sắc';
    } else if (ageYears < 40) {
      if (vo2Max < 28) return 'Kém';
      if (vo2Max < 34) return 'Trung bình';
      if (vo2Max < 42) return 'Tốt';
      return 'Xuất sắc';
    } else if (ageYears < 50) {
      if (vo2Max < 25) return 'Kém';
      if (vo2Max < 32) return 'Trung bình';
      if (vo2Max < 39) return 'Tốt';
      return 'Xuất sắc';
    } else {
      if (vo2Max < 22) return 'Kém';
      if (vo2Max < 28) return 'Trung bình';
      if (vo2Max < 35) return 'Tốt';
      return 'Xuất sắc';
    }
  }
}; 