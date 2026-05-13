import React, { useState } from 'react';
import { StatusBar, StyleSheet, View, Text, TextInput, Button, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Navigation Imports
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

// --- 1. THE HOME SCREEN (Your existing code) ---
function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const [glucose, setGlucose] = useState('');
  const [userName, setUserName] = useState('Tiffany');

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <Text style={styles.titleText}>GlucoMind</Text>
      <Text style={styles.greetingText}>Welcome back, {userName}!</Text>
      <Text style={styles.subtitleText}>Log your current level:</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. 110"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={glucose}
        onChangeText={setGlucose}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Save Reading"
          color="#007AFF"
          onPress={() => {
            Alert.alert('Success!', `${userName}, you logged: ${glucose} mg/dL`);
            setGlucose(''); 
          }}
        />
      </View>
    </View>
  );
}

// --- 2. THE ANALYTICS SCREEN (Placeholder) ---
function AnalyticsScreen() {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.titleText}>Analytics</Text>
      <Text style={styles.subtitleText}>7-Day Trend Coming Soon...</Text>
    </View>
  );
}

// --- 3. THE COACH SCREEN (Placeholder) ---
function CoachScreen() {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.titleText}>AI Coach</Text>
      <Text style={styles.subtitleText}>AWS Backend Coming Soon...</Text>
    </View>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Tab.Navigator 
          screenOptions={{ 
            headerShown: false, // Hides the default top bar
            tabBarActiveTintColor: '#007AFF',
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} />
          <Tab.Screen name="Coach" component={CoachScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 5,
    marginBottom: 20,
  },
  subtitleText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  input: {
    height: 50,
    width: '80%',
    backgroundColor: '#FFF',
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '50%',
    borderRadius: 8,
    overflow: 'hidden', 
  }
});

export default App;