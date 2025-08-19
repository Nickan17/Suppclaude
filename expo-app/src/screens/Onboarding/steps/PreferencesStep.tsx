import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { WebCompatibleSlider as Slider } from '../../../components/WebCompatibleSlider'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../../../theme'

interface PreferencesData {
  avoid_ingredients?: string[]
  preferred_forms?: string[]
  price_sensitivity?: number
  brand_trust?: string
}

interface PreferencesStepProps {
  data: PreferencesData
  onNext: (data: PreferencesData) => void
}

export const PreferencesStep: React.FC<PreferencesStepProps> = ({ data, onNext }) => {
  const [form, setForm] = useState<PreferencesData>({
    avoid_ingredients: data.avoid_ingredients || [],
    preferred_forms: data.preferred_forms || [],
    price_sensitivity: data.price_sensitivity || 3,
    brand_trust: data.brand_trust || '',
  })

  const avoidOptions = [
    { value: 'soy', label: 'Soy' },
    { value: 'gluten', label: 'Gluten' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'artificial_sweeteners', label: 'Artificial Sweeteners' },
    { value: 'proprietary_blends', label: 'Proprietary Blends' },
    { value: 'artificial_colors', label: 'Artificial Colors' },
    { value: 'gmo', label: 'GMO' },
  ]

  const formOptions = [
    { value: 'capsule', label: 'Capsules', emoji: '💊' },
    { value: 'powder', label: 'Powder', emoji: '🥤' },
    { value: 'gummy', label: 'Gummies', emoji: '🍬' },
    { value: 'liquid', label: 'Liquid', emoji: '💧' },
    { value: 'bar', label: 'Bars', emoji: '🍫' },
  ]

  const brandOptions = [
    { value: 'only_known', label: 'Only well-known brands' },
    { value: 'open_to_new', label: 'Open to new brands' },
    { value: 'prefer_boutique', label: 'Prefer boutique/specialty' },
  ]

  const toggleIngredient = (ingredient: string) => {
    const ingredients = form.avoid_ingredients || []
    if (ingredients.includes(ingredient)) {
      setForm({ ...form, avoid_ingredients: ingredients.filter(i => i !== ingredient) })
    } else {
      setForm({ ...form, avoid_ingredients: [...ingredients, ingredient] })
    }
  }

  const toggleForm = (formType: string) => {
    const forms = form.preferred_forms || []
    if (forms.includes(formType)) {
      setForm({ ...form, preferred_forms: forms.filter(f => f !== formType) })
    } else {
      setForm({ ...form, preferred_forms: [...forms, formType] })
    }
  }

  const getPriceSensitivityLabel = (value: number) => {
    if (value === 1) return "Price doesn't matter"
    if (value === 2) return "Prefer quality over price"
    if (value === 3) return "Balanced approach"
    if (value === 4) return "Budget conscious"
    if (value === 5) return "Very price sensitive"
    return ""
  }

  const handleNext = () => {
    onNext(form)
  }

  const isComplete = form.brand_trust && (form.preferred_forms?.length || 0) > 0

  return (
    <View style={styles.container}>
      {/* Avoid Ingredients */}
      <View style={styles.section}>
        <Text style={styles.label}>Any ingredients to avoid?</Text>
        <View style={styles.optionsGrid}>
          {avoidOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionChip,
                form.avoid_ingredients?.includes(option.value) && styles.optionChipActive,
              ]}
              onPress={() => toggleIngredient(option.value)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  form.avoid_ingredients?.includes(option.value) && styles.optionChipTextActive,
                ]}
              >
                {form.avoid_ingredients?.includes(option.value) && '✕ '}
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferred Forms */}
      <View style={styles.section}>
        <Text style={styles.label}>Preferred supplement forms</Text>
        <View style={styles.formsGrid}>
          {formOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.formCard,
                form.preferred_forms?.includes(option.value) && styles.formCardActive,
              ]}
              onPress={() => toggleForm(option.value)}
            >
              <Text style={styles.formEmoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.formText,
                  form.preferred_forms?.includes(option.value) && styles.formTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price Sensitivity */}
      <View style={styles.section}>
        <Text style={styles.label}>Price sensitivity</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.priceLabel}>{getPriceSensitivityLabel(form.price_sensitivity!)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={form.price_sensitivity}
            onValueChange={(value) => setForm({ ...form, price_sensitivity: value })}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderEndLabel}>💰💰💰</Text>
            <Text style={styles.sliderEndLabel}>💰</Text>
          </View>
        </View>
      </View>

      {/* Brand Trust */}
      <View style={styles.section}>
        <Text style={styles.label}>Brand preference</Text>
        {brandOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.brandOption,
              form.brand_trust === option.value && styles.brandOptionActive,
            ]}
            onPress={() => setForm({ ...form, brand_trust: option.value })}
          >
            <Text
              style={[
                styles.brandText,
                form.brand_trust === option.value && styles.brandTextActive,
              ]}
            >
              {option.label}
            </Text>
            {form.brand_trust === option.value && (
              <View style={styles.radio}>
                <View style={styles.radioDot} />
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionChipActive: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.danger + '10',
  },
  optionChipText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  optionChipTextActive: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  formsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  formCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  formCardActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.secondary + '10',
  },
  formEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  formText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  formTextActive: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: theme.spacing.sm,
  },
  sliderEndLabel: {
    fontSize: theme.typography.caption.fontSize,
  },
  brandOption: {
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
  brandOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  brandText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 1,
  },
  brandTextActive: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
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
