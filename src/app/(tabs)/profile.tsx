import { Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import {
  VStack,
  Host,
  Button,
  BottomSheet,
  ColorPicker,
} from '@expo/ui/swift-ui';
import { useState } from 'react';

export default function Profile() {
  const [isOpened, setIsOpened] = useState(false);
  const [color, setColor] = useState('#000000');
  return (
    <View style={styles.container}>
      <Text>Profile</Text>

      <Host>
        <Button onPress={() => setIsOpened(true)}>
          <Text style={{ color: color }}>Open Bottom Sheet</Text>
        </Button>
        <ColorPicker selection={color} onSelectionChange={setColor} />
        <VStack>
          <BottomSheet isPresented={isOpened} onIsPresentedChange={setIsOpened}>
            <View style={{ height: 500 }}>
              <Text>Bottom Sheet</Text>
            </View>
          </BottomSheet>
        </VStack>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
