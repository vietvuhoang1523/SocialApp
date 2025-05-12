import React from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';

export default function VideoPlayerScreen() {
  return (
    <View style={styles.container}>
     <Video
  source={{ uri: 'http://192.168.100.193:8082/api/videos/hls-stream?bucketName=thanh&path=cc/output.m3u8' }}
  style={styles.video}
  controls={true}
  resizeMode="contain"
  repeat={true}
  onError={(e) => console.log('Error:', e)}
  onEnd={() => console.log('Video ended')}
  onLoad={(e) => console.log('Video loaded', e)}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: 300,
  },
});
