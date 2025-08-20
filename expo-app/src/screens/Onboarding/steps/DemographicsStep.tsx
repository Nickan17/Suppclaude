import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { WebCompatibleSlider as Slider } from '../../../components/WebCompatibleSlider'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../../../theme'

interface DemographicsData {
  age?: number
  gender?: string
  weight_kg?: number
  height_cm?: number
  activity_level?: string
}

interface DemographicsStepProps {
  data: DemographicsData
  onNext: (data: DemographicsData) => void
}

export const DemographicsStep: React.FC<DemographicsStepProps> = ({ data, onNext }) => {
  const [form, setForm] = useState<DemographicsData>({
    age: data.age || 25,
    gender: data.gender || '',
    weight_kg: data.weight_kg || 70,
    height_cm: data.height_cm || 170,
    activity_level: data.activity_level || '',
  })

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ]

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
    { value: 'light', label: 'Light', desc: '1-3 days per week' },
    { value: 'moderate', label: 'Moderate', desc: '3-5 days per week' },
    { value: 'very_active', label: 'Very Active', desc: '6-7 days per week' },
    { value: 'athlete', label: 'Athlete', desc: 'Professional/competitive' },
  ]

  const handleNext = () => {
    onNext(form)
  }

  const isComplete = form.gender && form.activity_level

  return (
    <View style={styles.container}>
      {/* Age */}
      <View style={styles.section}>
        <Text style={styles.label}>Age</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>{Math.round(form.age!)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={80}
            value={form.age}
            onValueChange={(value) => setForm({ ...form, age: value })}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>18</Text>
            <Text style={styles.sliderLabel}>80</Text>
          </View>
        </View>
      </View>

      {/* Gender */}
      <View style={styles.section}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.optionsGrid}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                form.gender === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setForm({ ...form, gender: option.value })}
            >
              <Text
                style={[
                  styles.optionText,
                  form.gender === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.label}>Weight (kg)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={String(form.weight_kg)}
            onChangeText={(text) => setForm({ ...form, weight_kg: Number(text) || 0 })}
            keyboardType="numeric"
            placeholder="70"
          />
          <Text style={styles.unit}>kg</Text>
        </View>
      </View>

      {/* Height */}
      <View style={styles.section}>
        <Text style={styles.label}>Height (cm)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={String(form.height_cm)}
            onChangeText={(text) => setForm({ ...form, height_cm: Number(text) || 0 })}
            keyboardType="numeric"
            placeholder="170"
          />
          <Text style={styles.unit}>cm</Text>
        </View>
      </View>

      {/* Activity Level */}
      <View style={styles.section}>
        <Text style={styles.label}>Activity Level</Text>
        {activityOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.activityOption,
              form.activity_level === option.value && styles.activityOptionActive,
            ]}
            onPress={() => setForm({ ...form, activity_level: option.value })}
          >
            <View>
              <Text
                style={[
                  styles.activityTitle,
                  form.activity_level === option.value && styles.activityTitleActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.activityDesc}>{option.desc}</Text>
            </View>
            {form.activity_level === option.value && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        onPress={handleNext}
        disabled={!isComplete}
        activeOpacity={0.8}
        style={styles.nextButton}
      >
        <LinearGradient
          colors={
            isComplete
              ? [theme.colors.primary, '#FF8E8E']
              : [theme.colors.border, theme.colors.border]
          }
          style={styles.gradientButton}
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
    paddingBottom: 40,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.surface,
  },
  unit: {
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
  },
  activityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  activityOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  activityTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  activityTitleActive: {
    color: theme.colors.primary,
  },
  activityDesc: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
  },
  nextButton: {
    marginTop: 40,
    marginBottom: 60,
  },
  gradientButton: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
