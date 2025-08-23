import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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
      console.log('OnboardingScreen: handleComplete called')
      
      // Flatten the form data
      const flatData = {
        ...formData.demographics,
        ...formData.behavior,
        ...formData.goals,
        ...formData.preferences,
        current_stack: formData.stack,
      }
      
      console.log('OnboardingScreen: Sending data to completeOnboarding:', flatData)
      
      try {
        await completeOnboarding(flatData)
        console.log('OnboardingScreen: completeOnboarding successful')
      } catch (onboardingError) {
        console.error('OnboardingScreen: completeOnboarding failed, but continuing:', onboardingError)
        // Continue to navigation even if onboarding fails - this is for demo purposes
      }
      
      console.log('OnboardingScreen: navigating to Main')
      
      // Force navigation to Main screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      })
    } catch (error) {
      console.error('OnboardingScreen: Critical error:', error)
      // Force navigation anyway for demo
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      })
    }
  }

  const CurrentStepComponent = STEPS[currentStep].component
  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          scrollEnabled={true}
          alwaysBounceVertical={true}
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
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {currentStep > 0 && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
            
            {/* Demo Skip Button */}
            <TouchableOpacity 
              onPress={() => {
                console.log('Demo: Skipping to main app')
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' as never }],
                })
              }}
              style={styles.skipAllButton}
            >
              <Text style={styles.skipAllButtonText}>Skip to App</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{STEPS[currentStep].title}</Text>
          
          <CurrentStepComponent
            data={formData[STEPS[currentStep].id as keyof typeof formData]}
            onNext={handleNext}
          />
        </View>

        {/* Skip button */}
        <TouchableOpacity 
          style={{
            alignItems: 'center',
            paddingVertical: 16,
            marginTop: 20,
            marginBottom: 40,
            backgroundColor: currentStep === STEPS.length - 1 ? theme.colors.primary : 'red',
            padding: 10,
            borderRadius: 8,
          }}
          onPress={() => {
            console.log('EMERGENCY SKIP: Force navigation to Main')
            // Update the profile locally to mark onboarding as completed
            useStore.setState(state => ({
              profile: { ...state.profile!, onboarding_completed: true }
            }))
            // Force navigation to Main screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' as never }],
            })
          }}
        >
          <Text style={{
            fontSize: 16,
            color: 'white',
            fontWeight: 'bold',
          }}>EMERGENCY SKIP</Text>
        </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
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
  skipAllButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
  },
  skipAllButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: 'white',
    fontWeight: '600',
  },
})
