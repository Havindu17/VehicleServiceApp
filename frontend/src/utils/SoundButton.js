import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

const SoundButton = ({ onPress, children, style, ...props }) => {
  const playClickSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/Sounds/mixkit-arcade-game-jump-coin-216.wav'),
        { shouldPlay: true, volume: 1.0 }
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Sound error:', error);
    }
  };

  const handlePress = () => {
    playClickSound();
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity style={style} onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
};

export default SoundButton;