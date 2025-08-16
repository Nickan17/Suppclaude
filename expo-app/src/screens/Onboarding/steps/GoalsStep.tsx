import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../../../theme'

interface GoalsData {
  primary_goal?: string
  goals?: string[]
}

interface GoalsStepProps {
  data: GoalsData
  onNext: (data: GoalsData) => void
}

const GOALS = [
  { value: 'muscle_gain', label: 'Build Muscle', emoji: '💪' },
  { value: 'fat_loss', label: 'Lose Fat', emoji: '🔥' },
  { value: 'energy', label: 'More Energy', emoji: '⚡' },
  { value: 'sleep', label: 'Better Sleep', emoji: '😴' },
  { value: 'immunity', label: 'Immunity', emoji: '🛡️' },
  { value: 'longevity', label: 'Anti-Aging', emoji: '🌟' },
  { value: 'skin_health', label: 'Skin/Hair', emoji: '✨' },
  { value: 'cognitive', label: 'Brain/Focus', emoji: '🧠' },
  { value: 'joint_health', label: 'Joint Health', emoji: '🦴' },
  { value: 'athletic', label: 'Athletic Performance', emoji: '🏃' },
  { value: 'general', label: 'General Health', emoji: '❤️' },
]

export const GoalsStep: React.FC<GoalsStepProps> = ({ data, onNext }) => {
  const [form, setForm] = useState<GoalsData>({
    primary_goal: data.primary_goal || '',
    goals: data.goals || [],
  })
  const [step, setStep] = useState<'primary' | 'secondary'>('primary')

  const handlePrimaryGoal = (goal: string) => {
    setForm({ ...form, primary_goal: goal, goals: [goal] })
    setStep('secondary')
  }

  const toggleSecondaryGoal = (goal: string) => {
    if (goal === form.primary_goal) return // Can't deselect primary

    const goals = form.goals || []
    if (goals.includes(goal)) {
      setForm({ ...form, goals: goals.filter(g => g !== goal) })
    } else if (goals.length < 4) { // Max 3 secondary + 1 primary
      setForm({ ...form, goals: [...goals, goal] })
    }
  }

  const handleNext = () => {
    onNext(form)
  }

  const isComplete = form.primary_goal && (form.goals?.length || 0) > 0

  if (step === 'primary') {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          What's your main goal with supplements?
        </Text>
        
        <View style={styles.goalsGrid}>
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.value}
              style={styles.primaryGoalCard}
              onPress={() => handlePrimaryGoal(goal.value)}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text style={styles.primaryGoalText}>{goal.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Any other goals? (Select up to 3 more)
      </Text>
      
      <View style={styles.primarySelectedContainer}>
        <Text style={styles.primarySelectedLabel}>Primary Goal:</Text>
        <View style={styles.primarySelectedBadge}>
          <Text style={styles.primarySelectedText}>
            {GOALS.find(g => g.value === form.primary_goal)?.emoji} {' '}
            {GOALS.find(g => g.value === form.primary_goal)?.label}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.secondaryGoalsGrid}>
          {GOALS.filter(g => g.value !== form.primary_goal).map((goal) => (
            <TouchableOpacity
              key={goal.value}
              style={[
                styles.secondaryGoalCard,
                form.goals?.includes(goal.value) && styles.secondaryGoalCardActive,
              ]}
              onPress={() => toggleSecondaryGoal(goal.value)}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text
                style={[
                  styles.secondaryGoalText,
                  form.goals?.includes(goal.value) && styles.secondaryGoalTextActive,
                ]}
              >
                {goal.label}
              </Text>
              {form.goals?.includes(goal.value) && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.selectedCount}>
        {((form.goals?.length || 0) - 1)} of 3 additional goals selected
      </Text>

      {/* Next Button */}
      <TouchableOpacity
        onPress={handleNext}
        disabled={!isComplete}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isComplete
              ? [theme.colors.primary, '#FF8E8E']
              : [theme.colors.border, theme.colors.border]
          }
          style={styles.nextButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: theme.spacing.xxl,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  primaryGoalCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  goalEmoji: {
    fontSize: 36,
    marginBottom: theme.spacing.sm,
  },
  primaryGoalText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  primarySelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  primarySelectedLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    marginRight: theme.spacing.sm,
  },
  primarySelectedBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
  },
  primarySelectedText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  secondaryGoalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  secondaryGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  secondaryGoalCardActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondary + '10',
  },
  secondaryGoalText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  secondaryGoalTextActive: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 12,
  },
  selectedCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  nextButton: {
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
})
