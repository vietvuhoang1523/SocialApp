import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
const ThemeContext = createContext();

// Default color schemes
const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  textLight: '#757575',
  primary: '#E91E63',
  secondary: '#2196F3',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#03A9F4',
  border: '#E0E0E0',
  cardBackground: '#FFFFFF',
  inputBackground: '#F5F5F5',
  buttonDisabled: '#D3D3D3',
};

const darkTheme = {
  background: '#121212',
  text: '#FFFFFF',
  textLight: '#AAAAAA',
  primary: '#FF4081',
  secondary: '#64B5F6',
  error: '#FF5252',
  success: '#69F0AE',
  warning: '#FFD740',
  info: '#40C4FF',
  border: '#333333',
  cardBackground: '#1E1E1E',
  inputBackground: '#333333',
  buttonDisabled: '#555555',
};

// Provider component
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState('light'); // 'light', 'dark', 'system'
  const [colors, setColors] = useState(lightTheme);

  // Load saved theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme) {
          setThemeType(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Update colors based on theme type
  useEffect(() => {
    const setThemeColors = () => {
      if (themeType === 'system') {
        setColors(systemColorScheme === 'dark' ? darkTheme : lightTheme);
      } else {
        setColors(themeType === 'dark' ? darkTheme : lightTheme);
      }
    };
    
    setThemeColors();
  }, [themeType, systemColorScheme]);

  // Toggle theme function
  const toggleTheme = async () => {
    const newTheme = themeType === 'dark' ? 'light' : 'dark';
    setThemeType(newTheme);
    
    try {
      await AsyncStorage.setItem('themePreference', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Set specific theme
  const setTheme = async (theme) => {
    setThemeType(theme);
    
    try {
      await AsyncStorage.setItem('themePreference', theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ colors, themeType, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 