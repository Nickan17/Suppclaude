import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { theme } from '../../theme'
import { useStore } from '../../store'
import { DemographicsStep } from './steps/DemographicsStep'
import { BehaviorStep } from './steps/BehaviorStep'
import { GoalsStep } from './steps/GoalsStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { StackAuditStep } from './steps/StackAuditStep'

const { width: screenWidth } = Dimensions.get('window')

const STEPS = [
  { id: 'demographics', title: 'About You', component: DemographicsStep },
  { id: 'behavior', title: 'Your Habits', component: BehaviorStep },
  { id: 'goals', title: 'Your Goals', component: GoalsStep },
  { id: 'preferences', title: 'Preferences', component: PreferencesStep },
  { id: 'stack', title: 'Current Stack', component: StackAuditStep },
]

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation()
  const { completeOnboarding, updateOnboardingStep } = useStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    demographics: {},
    behavior: {},
    goals: {},
    preferences: {},
    stack: {},
  })

  const handleNext = (stepData: any) => {
    const stepKey = STEPS[currentStep].id
    setFormData(prev => ({ ...prev, [stepKey]: stepData }))

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      updateOnboardingStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      updateOnboardingStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      // Flatten the form data
      const flatData = {
        ...formData.demographics,
        ...formData.behavior,
        ...formData.goals,
        ...formData.preferences,
        current_stack: formData.stack,
      }

      await completeOnboarding(flatData)
      navigation.navigate('Main' as never)
    } catch (error) {
      console.error('Onboarding error:', error)
    }
  }

  const CurrentStepComponent = STEPS[currentStep].component
  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={[styles.progressFill, { width: `${progress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.stepText}>
              Step {currentStep + 1} of {STEPS.length}
            </Text>
          </View>
          
          {currentStep > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{STEPS[currentStep].title}</Text>
          
          <CurrentStepComponent
            data={formData[STEPS[currentStep].id as keyof typeof formData]}
            onNext={handleNext}
          />
        </ScrollView>

        {/* Skip button */}
        {currentStep === STEPS.length - 1 && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleComplete}
          >
            <Text style={styles.skipButtonText}>Skip this step</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  progressContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  skipButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
})
