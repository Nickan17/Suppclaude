import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../../../theme'

interface StackProduct {
  name: string
  satisfaction: number
  repurchaseIntent: boolean
}

interface StackData {
  products?: StackProduct[]
  biggestPainPoint?: string
}

interface StackAuditStepProps {
  data: StackData
  onNext: (data: StackData) => void
}

export const StackAuditStep: React.FC<StackAuditStepProps> = ({ data, onNext }) => {
  const [form, setForm] = useState<StackData>({
    products: data.products || [],
    biggestPainPoint: data.biggestPainPoint || '',
  })
  const [newProductName, setNewProductName] = useState('')

  const painPoints = [
    { value: 'expensive', label: 'Too expensive' },
    { value: 'no_results', label: 'Not seeing results' },
    { value: 'too_many', label: 'Too many pills' },
    { value: 'side_effects', label: 'Side effects' },
    { value: 'quality_concerns', label: 'Quality concerns' },
    { value: 'none', label: 'No major issues' },
  ]

  const addProduct = () => {
    if (newProductName.trim()) {
      setForm({
        ...form,
        products: [
          ...(form.products || []),
          {
            name: newProductName.trim(),
            satisfaction: 3,
            repurchaseIntent: false,
          },
        ],
      })
      setNewProductName('')
    }
  }

  const updateProduct = (index: number, updates: Partial<StackProduct>) => {
    const products = [...(form.products || [])]
    products[index] = { ...products[index], ...updates }
    setForm({ ...form, products })
  }

  const removeProduct = (index: number) => {
    const products = [...(form.products || [])]
    products.splice(index, 1)
    setForm({ ...form, products })
  }

  const handleNext = () => {
    onNext(form)
  }

  const renderStars = (rating: number, onChange: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
          >
            <Text style={[styles.star, star <= rating && styles.starFilled]}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.subtitle}>
        Let's quickly review what you're currently taking (optional)
      </Text>

      {/* Add Product */}
      <View style={styles.addProductContainer}>
        <TextInput
          style={styles.input}
          placeholder="Product name (e.g., Whey Protein)"
          value={newProductName}
          onChangeText={setNewProductName}
          onSubmitEditing={addProduct}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addProduct}
          disabled={!newProductName.trim()}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {form.products && form.products.length > 0 && (
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Your Current Stack</Text>
          {form.products.map((product, index) => (
            <View key={index} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <TouchableOpacity onPress={() => removeProduct(index)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.productDetails}>
                <View style={styles.satisfactionRow}>
                  <Text style={styles.detailLabel}>Satisfaction:</Text>
                  {renderStars(
                    product.satisfaction,
                    (rating) => updateProduct(index, { satisfaction: rating })
                  )}
                </View>
                
                <View style={styles.repurchaseRow}>
                  <Text style={styles.detailLabel}>Would repurchase?</Text>
                  <View style={styles.toggleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        product.repurchaseIntent && styles.toggleButtonActive,
                      ]}
                      onPress={() => updateProduct(index, { repurchaseIntent: true })}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          product.repurchaseIntent && styles.toggleButtonTextActive,
                        ]}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        !product.repurchaseIntent && styles.toggleButtonActive,
                      ]}
                      onPress={() => updateProduct(index, { repurchaseIntent: false })}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          !product.repurchaseIntent && styles.toggleButtonTextActive,
                        ]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pain Points */}
      <View style={styles.painPointsSection}>
        <Text style={styles.sectionTitle}>Biggest supplement challenge?</Text>
        <View style={styles.painPointsGrid}>
          {painPoints.map((point) => (
            <TouchableOpacity
              key={point.value}
              style={[
                styles.painPointCard,
                form.biggestPainPoint === point.value && styles.painPointCardActive,
              ]}
              onPress={() => setForm({ ...form, biggestPainPoint: point.value })}
            >
              <Text
                style={[
                  styles.painPointText,
                  form.biggestPainPoint === point.value && styles.painPointTextActive,
                ]}
              >
                {point.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#FF8E8E']}
          style={styles.nextButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.nextButtonText}>Complete Setup</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
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
  addProductContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
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
  addButton: {
    height: 48,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  productsContainer: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  productName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.text,
  },
  removeButton: {
    fontSize: 20,
    color: theme.colors.textMuted,
    padding: theme.spacing.xs,
  },
  productDetails: {
    gap: theme.spacing.sm,
  },
  satisfactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  star: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  starFilled: {
    color: '#FFD700',
  },
  repurchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  toggleButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  toggleButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  painPointsSection: {
    marginBottom: theme.spacing.xl,
  },
  painPointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  painPointCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  painPointCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  painPointText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  painPointTextActive: {
    color: theme.colors.primary,
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
