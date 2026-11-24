import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow gap-6 px-6 py-4">
        <View className="gap-2">
          <Text accessibilityRole="header" className="text-3xl font-semibold text-foreground">Home</Text>
          <Text className="text-base text-muted-foreground">Your app is ready to build.</Text>
        </View>
        <Link href="/details" asChild>
          <Button variant="outline" className="min-h-12 flex-row justify-between px-4">
            <Text>View details</Text>
            <FontAwesome6 name="chevron-right" size={14} color="#64748b" />
          </Button>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
