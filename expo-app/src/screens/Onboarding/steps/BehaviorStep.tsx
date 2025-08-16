import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../../../theme'

interface BehaviorData {
  monthly_spend_usd?: number
  current_supplement_count?: string
  years_taking_supplements?: string
  purchase_channels?: string[]
}

interface BehaviorStepProps {
  data: BehaviorData
  onNext: (data: BehaviorData) => void
}

export const BehaviorStep: React.FC<BehaviorStepProps> = ({ data, onNext }) => {
  const [form, setForm] = useState<BehaviorData>({
    monthly_spend_usd: data.monthly_spend_usd || 50,
    current_supplement_count: data.current_supplement_count || '',
    years_taking_supplements: data.years_taking_supplements || '',
    purchase_channels: data.purchase_channels || [],
  })

  const supplementCountOptions = [
    { value: '0', label: 'None' },
    { value: '1-3', label: '1-3' },
    { value: '4-6', label: '4-6' },
    { value: '7-10', label: '7-10' },
    { value: '10+', label: '10+' },
  ]

  const yearsOptions = [
    { value: 'new', label: 'Just starting' },
    { value: '<1', label: 'Less than 1 year' },
    { value: '1-3', label: '1-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5+', label: 'More than 5 years' },
  ]

  const channelOptions = [
    { value: 'amazon', label: 'Amazon' },
    { value: 'gnc', label: 'GNC' },
    { value: 'bodybuilding', label: 'Bodybuilding.com' },
    { value: 'local', label: 'Local Store' },
    { value: 'gym', label: 'Gym' },
    { value: 'clinic', label: 'Doctor/Clinic' },
    { value: 'online', label: 'Other Online' },
  ]

  const toggleChannel = (channel: string) => {
    const channels = form.purchase_channels || []
    if (channels.includes(channel)) {
      setForm({ ...form, purchase_channels: channels.filter(c => c !== channel) })
    } else {
      setForm({ ...form, purchase_channels: [...channels, channel] })
    }
  }

  const handleNext = () => {
    onNext(form)
  }

  const isComplete = form.current_supplement_count && 
                    form.years_taking_supplements && 
                    (form.purchase_channels?.length || 0) > 0

  return (
    <View style={styles.container}>
      {/* Monthly Spend */}
      <View style={styles.section}>
        <Text style={styles.label}>Monthly Supplement Budget</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>
            ${Math.round(form.monthly_spend_usd!)}
            {form.monthly_spend_usd! >= 500 && '+'}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={500}
            value={form.monthly_spend_usd}
            onValueChange={(value) => setForm({ ...form, monthly_spend_usd: value })}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>$0</Text>
            <Text style={styles.sliderLabel}>$500+</Text>
          </View>
        </View>
      </View>

      {/* Current Supplement Count */}
      <View style={styles.section}>
        <Text style={styles.label}>How many supplements do you currently take?</Text>
        <View style={styles.optionsGrid}>
          {supplementCountOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                form.current_supplement_count === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setForm({ ...form, current_supplement_count: option.value })}
            >
              <Text
                style={[
                  styles.optionText,
                  form.current_supplement_count === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Years Taking */}
      <View style={styles.section}>
        <Text style={styles.label}>How long have you been taking supplements?</Text>
        <View style={styles.optionsGrid}>
          {yearsOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                form.years_taking_supplements === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setForm({ ...form, years_taking_supplements: option.value })}
            >
              <Text
                style={[
                  styles.optionText,
                  form.years_taking_supplements === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Purchase Channels */}
      <View style={styles.section}>
        <Text style={styles.label}>Where do you buy supplements? (Select all that apply)</Text>
        <View style={styles.channelGrid}>
          {channelOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.channelButton,
                form.purchase_channels?.includes(option.value) && styles.channelButtonActive,
              ]}
              onPress={() => toggleChannel(option.value)}
            >
              <Text
                style={[
                  styles.channelText,
                  form.purchase_channels?.includes(option.value) && styles.channelTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sliderLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  channelButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  channelButtonActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondary + '10',
  },
  channelText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  channelTextActive: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  nextButton: {
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  nextButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
})
