import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { Scan, History, User } from 'lucide-react-native'
import Toast from 'react-native-toast-message'

// Import screens
import { OnboardingScreen } from './src/screens/Onboarding/OnboardingScreen'
import { ScannerScreen } from './src/screens/ScannerScreen'
import { ScoreDisplayScreen } from './src/screens/ScoreDisplayScreen'
import { HistoryScreen } from './src/screens/HistoryScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { AuthScreen } from './src/screens/AuthScreen'
import { AlternativesScreen } from './src/screens/AlternativesScreen'

// Import store and theme
import { useStore } from './src/store'
import { theme } from './src/theme'
import { supabase } from './src/services/supabase'
import { initializeCache } from './src/services/cache'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => <Scan size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
          headerTitle: 'Scan History',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  )
}

// Root navigator
function RootNavigator() {
  const { isAuthenticated, profile, isLoading } = useStore()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !profile?.onboarding_completed ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen 
            name="ScoreDisplay" 
            component={ScoreDisplayScreen}
            options={{
              headerShown: true,
              headerTitle: 'Analysis Results',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen 
            name="Alternatives" 
            component={AlternativesScreen}
            options={{
              headerShown: true,
              headerTitle: 'Better Options',
              headerBackTitle: 'Back',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  const { setUser, setIsLoading } = useStore()

  useEffect(() => {
    // Initialize cache
    initializeCache()
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}