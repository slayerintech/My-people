import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';

export default function BottomTabBar({ state, descriptors, navigation }) {
  const { mapMode, setMapMode } = useApp();

  const iconFor = (name) => {
    return name === 'Home' ? 'home' : name === 'Share' ? 'location' : name === 'View' ? 'map' : name === 'Pair' ? 'link' : 'settings';
  };

  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius, paddingVertical: 8, paddingHorizontal: 12, gap: 8, ...shadow }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ backgroundColor: '#1F2234', borderRadius: 16, overflow: 'hidden', flexDirection: 'row' }}>
            <Text onPress={() => setMapMode('traffic')} style={{ color: mapMode === 'traffic' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 8 }}>Traffic</Text>
            <Text onPress={() => setMapMode('satellite')} style={{ color: mapMode === 'satellite' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 8 }}>Satellite</Text>
            <Text onPress={() => setMapMode('hybrid')} style={{ color: mapMode === 'hybrid' ? colors.primaryText : colors.secondaryText, paddingHorizontal: 12, paddingVertical: 8 }}>Hybrid</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 }}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            const color = isFocused ? colors.accent : colors.secondaryText;
            return (
              <TouchableOpacity key={route.key} accessibilityRole="button" onPress={onPress} style={{ padding: 8 }}>
                <Ionicons name={iconFor(route.name)} color={color} size={22} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
