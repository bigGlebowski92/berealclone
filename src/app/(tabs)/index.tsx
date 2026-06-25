import { Button, Host, Text, VStack } from '@expo/ui/swift-ui';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  return (
    <Host useViewportSizeMeasurement>
      <VStack alignment="center" spacing={16}>
        <Text>asdads</Text>
        <Button label="Go to About" onPress={() => router.push('/about')} />
      </VStack>
    </Host>
  );
}
