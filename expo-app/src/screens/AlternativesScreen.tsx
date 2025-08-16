import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { TrendingUp, DollarSign, Award, ChevronRight } from 'lucide-react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { theme } from '../theme'
import { useStore } from '../store'
import { supabase, scoreToGrade, getGradeColor } from '../services/supabase'

export const AlternativesScreen: React.FC = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { productId } = route.params as { productId: string }
  const { alternatives } = useStore()
  
  const [originalProduct, setOriginalProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOriginalProduct()
  }, [productId])

  const loadOriginalProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      setOriginalProduct(data)
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderAlternative = (item: any, index: number) => {
    const improvement = (item.product?.overall_score || 0) - (originalProduct?.overall_score || 0)
    const grade = scoreToGrade(item.product?.overall_score || 0)
    const gradeColor = getGradeColor(grade)
    const priceDiff = item.price_difference || 0

    return (
      <TouchableOpacity
        key={item.product?.id || index}
        style={styles.alternativeCard}
        onPress={() => navigation.navigate('ScoreDisplay' as never, { productId: item.product?.id } as never)}
      >
        <View style={styles.alternativeHeader}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.alternativeInfo}>
            <Text style={styles.alternativeName} numberOfLines={1}>
              {item.product?.name}
            </Text>
            <Text style={styles.alternativeBrand}>
              {item.product?.brand}
            </Text>
          </View>
          <View style={styles.scoreImprovement}>
            <Text style={[styles.newGrade, { color: gradeColor }]}>{grade}</Text>
            <Text style={styles.improvementText}>+{improvement} pts</Text>
          </View>
        </View>

        {/* Improvement Areas */}
        <View style={styles.improvementChips}>
          {item.reasons?.map((reason: string, idx: number) => (
            <View key={idx} style={styles.improvementChip}>
              <Text style={styles.improvementChipText}>{reason}</Text>
            </View>
          ))}
        </View>

        {/* Key Benefits */}
        <View style={styles.benefitsRow}>
          {improvement > 0 && (
            <View style={styles.benefit}>
              <TrendingUp size={16} color={theme.colors.success} />
              <Text style={styles.benefitText}>Better Score</Text>
            </View>
          )}
          {priceDiff > 0 && (
            <View style={styles.benefit}>
              <DollarSign size={16} color={theme.colors.success} />
              <Text style={styles.benefitText}>Save ${priceDiff.toFixed(2)}/mo</Text>
            </View>
          )}
          {item.product?.third_party_tested && (
            <View style={styles.benefit}>
              <Award size={16} color={theme.colors.info} />
              <Text style={styles.benefitText}>3rd Party Tested</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <ChevronRight size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <LinearGradient
              colors={[theme.colors.secondary, '#5DE0D6']}
              style={styles.buyButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buyButtonText}>Check Price</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Original Product Summary */}
        {originalProduct && (
          <View style={styles.originalCard}>
            <Text style={styles.originalLabel}>Current Product</Text>
            <View style={styles.originalInfo}>
              <View>
                <Text style={styles.originalName}>{originalProduct.name}</Text>
                <Text style={styles.originalBrand}>{originalProduct.brand}</Text>
              </View>
              <View style={styles.originalScore}>
                <Text style={[
                  styles.originalGrade, 
                  { color: getGradeColor(scoreToGrade(originalProduct.overall_score || 0)) }
                ]}>
                  {scoreToGrade(originalProduct.overall_score || 0)}
                </Text>
                <Text style={styles.originalScoreText}>
                  {originalProduct.overall_score}/100
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Alternatives */}
        <View style={styles.alternativesContainer}>
          <Text style={styles.sectionTitle}>Better Alternatives</Text>
          {alternatives.length > 0 ? (
            alternatives.map((alt, index) => renderAlternative(alt, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No better alternatives found. This might already be a great choice!
              </Text>
            </View>
          )}
        </View>

        {/* Savings Summary */}
        {alternatives.length > 0 && (
          <View style={styles.savingsSummary}>
            <Text style={styles.savingsTitle}>💰 Potential Savings</Text>
            <Text style={styles.savingsText}>
              Switch to our top recommendation and save up to{' '}
              <Text style={styles.savingsAmount}>
                ${Math.max(...alternatives.map((a: any) => a.price_difference || 0)).toFixed(2)}
              </Text>
              {' '}per month!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  originalCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  originalLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  originalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  originalName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  originalBrand: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  originalScore: {
    alignItems: 'center',
  },
  originalGrade: {
    fontSize: 28,
    fontWeight: '700',
  },
  originalScoreText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  alternativesContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  alternativeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  rankText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  alternativeInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  alternativeName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  alternativeBrand: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  scoreImprovement: {
    alignItems: 'center',
  },
  newGrade: {
    fontSize: 24,
    fontWeight: '700',
  },
  improvementText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.success,
    fontWeight: '600',
  },
  improvementChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  improvementChip: {
    backgroundColor: theme.colors.secondary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  improvementChipText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  benefitsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  benefitText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.full,
  },
  viewButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  buyButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  buyButtonText: {
    fontSize: theme.typography.caption.fontSize,
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  savingsSummary: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.success + '10',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  savingsTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  savingsText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  savingsAmount: {
    fontWeight: '700',
    color: theme.colors.success,
  },
})
