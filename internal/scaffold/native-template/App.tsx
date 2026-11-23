import './global.css';

import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerClassName="grow justify-center px-5 py-8">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader>
              <CardTitle>React Native Starter</CardTitle>
              <CardDescription>Ready to build your app for iOS and Android.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onPress={() => setStarted((value) => !value)}>
                <Text>{started ? 'Ready to build' : 'Get started'}</Text>
              </Button>
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
