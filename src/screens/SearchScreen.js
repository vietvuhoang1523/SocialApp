import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const SearchBar = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.searchContainer} onPress={() => navigation.navigate("Search")}>
      <Icon name="search" size={24} color="#ccc" style={{ marginHorizontal: 8 }} />
      <TextInput
        style={styles.input}
        placeholder="Tìm kiếm phim..."
        placeholderTextColor="#ccc"
        editable={false}
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
});
