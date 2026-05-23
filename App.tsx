import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, TextInput, Button, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Navigation Imports
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// HealthKit — uses real native module on device, mock in simulator
import { HK, HKPermissions, HealthKitPermissions, HealthUnit, HealthValue } from './src/healthkit';
import AnalyticsScreen from './src/AnalyticsScreen';

const Tab = createBottomTabNavigator();

const HK_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [HKPermissions.BloodGlucose],
    write: [HKPermissions.BloodGlucose],
  },
};

// --- 1. THE HOME SCREEN ---
function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const [glucose, setGlucose] = useState('');
  const [userName] = useState('Tiffany');
  const [healthKitStatus, setHealthKitStatus] = useState('Connecting...');
  const [isHKReady, setIsHKReady] = useState(false);
  const [recentReadings, setRecentReadings] = useState<HealthValue[]>([]);

  function fetchReadings() {
    HK.getBloodGlucoseSamples(
      {
        unit: HealthUnit.mgPerdL,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ascending: false,
        limit: 10,
      },
      (err, results) => {
        if (err) {
          console.log('Error fetching glucose samples:', err);
          return;
        }
        setRecentReadings(results);
      },
    );
  }

  useEffect(() => {
    HK.initHealthKit(HK_PERMISSIONS, (err: string) => {
      if (err) {
        console.log('Error initializing HealthKit:', err);
        setHealthKitStatus('Failed to Connect ❌');
        return;
      }
      setHealthKitStatus('Connected to Apple Health ✅');
      setIsHKReady(true);
      fetchReadings();
    });
  }, []);

  function saveReading() {
    const value = parseFloat(glucose);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid glucose reading.');
      return;
    }
    if (!isHKReady) {
      Alert.alert('Not Connected', 'HealthKit is not ready yet.');
      return;
    }
    HK.saveBloodGlucoseSample(
      {
        value,
        unit: HealthUnit.mgPerdL,
        startDate: new Date().toISOString(),
      },
      (err) => {
        if (err) {
          console.log('Error saving glucose sample:', err);
          Alert.alert('Error', 'Could not save reading to Apple Health.');
          return;
        }
        Alert.alert('Saved!', `${value} mg/dL logged to Apple Health.`);
        setGlucose('');
        fetchReadings();
      },
    );
  }

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <Text style={styles.titleText}>GlucoMind</Text>
      <Text style={styles.greetingText}>Welcome back, {userName}!</Text>

      <Text style={[styles.statusText, healthKitStatus.includes('✅') && styles.statusConnected]}>
        {healthKitStatus}
      </Text>

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
        <Button title="Save Reading" color="#007AFF" onPress={saveReading} />
      </View>

      {recentReadings.length > 0 && (
        <View style={styles.readingsContainer}>
          <Text style={styles.subtitleText}>Recent Readings</Text>
          {recentReadings.slice(0, 5).map((reading, index) => (
            <View key={index} style={styles.readingRow}>
              <Text style={styles.readingDate}>
                {new Date(reading.startDate).toLocaleDateString()}
              </Text>
              <Text style={styles.readingValue}>{reading.value} mg/dL</Text>
            </View>
          ))}
        </View>
      )}
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
            headerShown: false,
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
  statusText: {
    color: '#666',
    marginBottom: 20,
    fontWeight: '600',
  },
  statusConnected: {
    color: 'green',
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
  },
  readingsContainer: {
    marginTop: 24,
    width: '80%',
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  readingDate: {
    color: '#444',
    fontSize: 16,
  },
  readingValue: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
