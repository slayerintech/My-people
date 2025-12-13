import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '../theme';

export default function UserMarker({ coordinate, title, active = false }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true })
      ])
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.4] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const circleColor = active ? colors.success : '#ff3b30';
  return (
    <Marker coordinate={coordinate} title={title}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: circleColor,
            opacity,
            transform: [{ scale }]
          }}
        />
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: circleColor, borderWidth: 2, borderColor: '#fff' }} />
        {!!title && (
          <Text style={{ color: '#fff', fontSize: 12, marginTop: 6 }}>{title}</Text>
        )}
      </View>
    </Marker>
  );
}
