import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { colors, radius, shadow } from '../theme';

export default function Popup({ visible, title, message, confirmText = 'OK', cancelText = 'Cancel', onConfirm, onCancel }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={{ flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: radius, width: '86%', gap: 12, ...shadow }}>
          {!!title && <Text style={{ color: colors.primaryText, fontSize: 18, fontWeight: '600' }}>{title}</Text>}
          {!!message && <Text style={{ color: colors.secondaryText }}>{message}</Text>}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
            <TouchableOpacity onPress={onCancel} style={{ backgroundColor: '#1F2234', borderRadius: radius, paddingVertical: 10, paddingHorizontal: 16 }}>
              <Text style={{ color: colors.secondaryText }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={{ backgroundColor: colors.accent, borderRadius: radius, paddingVertical: 10, paddingHorizontal: 16, ...shadow }}>
              <Text style={{ color: colors.primaryText, fontWeight: '600' }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
