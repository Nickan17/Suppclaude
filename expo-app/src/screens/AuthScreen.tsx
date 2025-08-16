import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../theme'
import { useStore } from '../store'

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, signup } = useStore()

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await signup(email, password)
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🧪</Text>
            <Text style={styles.title}>SupplementIQ</Text>
            <Text style={styles.subtitle}>
              Stop wasting money on junk supplements
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={handleAuth}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, '#FF8E8E']}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📊</Text>
              <Text style={styles.featureText}>
                AI-powered supplement analysis
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>💰</Text>
              <Text style={styles.featureText}>
                Save money with smart alternatives
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🎯</Text>
              <Text style={styles.featureText}>
                Personalized recommendations
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.spacing.xxl,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  button: {
    height: 56,
    borderRadius: theme.radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  switchText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
  },
  features: {
    gap: theme.spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    flex: 1,
  },
})
