import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';

export default function DetailsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerClassName="gap-2 px-6 py-4">
        <Text accessibilityRole="header" className="text-2xl font-semibold text-foreground">Details</Text>
        <Text className="text-base text-muted-foreground">Add content for this screen.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
