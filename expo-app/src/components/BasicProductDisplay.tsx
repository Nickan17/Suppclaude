import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Beaker, Package, AlertTriangle, Sparkles, Star, Award } from 'lucide-react-native'
import { theme } from '../theme'

// Grade color mapping for beautiful visual feedback
const getGradeColor = (grade?: string) => {
  if (!grade) return theme.colors.textMuted
  const gradeLevel = grade.replace(/[+\-]/g, '')
  switch (gradeLevel) {
    case 'A': return '#10B981' // Emerald green
    case 'B': return '#3B82F6' // Blue
    case 'C': return '#F59E0B' // Amber
    case 'D': return '#EF4444' // Red
    case 'F': return '#7F1D1D' // Dark red
    default: return theme.colors.textMuted
  }
}

const getGradeBackground = (grade?: string) => {
  if (!grade) return theme.colors.surface
  const gradeLevel = grade.replace(/[+\-]/g, '')
  switch (gradeLevel) {
    case 'A': return '#ECFDF5' // Light emerald
    case 'B': return '#EFF6FF' // Light blue
    case 'C': return '#FFFBEB' // Light amber
    case 'D': return '#FEF2F2' // Light red
    case 'F': return '#FEF2F2' // Light red
    default: return theme.colors.surface
  }
}

interface BasicProductDisplayProps {
  product: any
  onAddToStack?: () => void
  onFindAlternatives?: () => void
  onAnalyzeWithAI?: () => void
}

export const BasicProductDisplay: React.FC<BasicProductDisplayProps> = ({
  product,
  onAddToStack,
  onFindAlternatives,
  onAnalyzeWithAI,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Grade Badge - Only show if we have analysis */}
        {product.analysis?.grade && (
          <View style={[styles.gradeBadge, { backgroundColor: getGradeBackground(product.analysis.grade) }]}>
            <Text style={[styles.gradeText, { color: getGradeColor(product.analysis.grade) }]}>
              {product.analysis.grade}
            </Text>
            <Award size={20} color={getGradeColor(product.analysis.grade)} />
            <Text style={[styles.gradeLabel, { color: getGradeColor(product.analysis.grade) }]}>
              Score: {product.analysis.overall_score}/100
            </Text>
          </View>
        )}
        
        <View style={styles.iconContainer}>
          <Package size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>{product.name || product.title}</Text>
        <Text style={styles.subtitle}>
          {product.analysis ? 'AI Analysis Complete' : 'Product Analysis'}
        </Text>
      </View>

      {/* Extracted Data Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Beaker size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Extracted Information</Text>
        </View>
        
        {product.ingredients && product.ingredients.length > 0 ? (
          <View style={styles.dataContainer}>
            <Text style={styles.dataLabel}>Ingredients ({product.ingredients.length})</Text>
            {product.ingredients.slice(0, 5).map((ingredient: string, index: number) => (
              <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
            ))}
            {product.ingredients.length > 5 && (
              <Text style={styles.moreText}>+{product.ingredients.length - 5} more ingredients</Text>
            )}
          </View>
        ) : (
          <View style={styles.dataContainer}>
            <Text style={styles.noDataText}>No ingredients extracted yet</Text>
            <Text style={styles.noDataSubtext}>
              Our OCR is processing the product images. This may take a moment.
            </Text>
          </View>
        )}

        {(product.supplement_facts || product.supplementFacts) && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataLabel}>Nutrition Facts</Text>
            <Text style={styles.factsText} numberOfLines={3}>
              {product.supplement_facts || product.supplementFacts?.raw}
            </Text>
          </View>
        )}
      </View>

      {/* AI Analysis Preview Section */}
      {product.analysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>AI Analysis Results</Text>
          </View>
          <View style={styles.analysisContainer}>
            <View style={styles.analysisRow}>
              <Text style={styles.analysisLabel}>Overall Score:</Text>
              <Text style={[styles.analysisScore, { color: theme.colors.primary }]}>
                {product.analysis.overall_score}/100 ({product.analysis.grade})
              </Text>
            </View>
            <View style={styles.scoresGrid}>
              <View style={styles.miniScore}>
                <View style={[styles.scoreIcon, { backgroundColor: '#4ECDC420' }]}>
                  <Beaker size={16} color="#4ECDC4" />
                </View>
                <Text style={styles.miniLabel}>Purity</Text>
                <Text style={[styles.miniValue, { color: '#4ECDC4' }]}>{product.analysis.purity_score}</Text>
              </View>
              <View style={styles.miniScore}>
                <View style={[styles.scoreIcon, { backgroundColor: '#B19CD920' }]}>
                  <Star size={16} color="#B19CD9" />
                </View>
                <Text style={styles.miniLabel}>Efficacy</Text>
                <Text style={[styles.miniValue, { color: '#B19CD9' }]}>{product.analysis.efficacy_score}</Text>
              </View>
              <View style={styles.miniScore}>
                <View style={[styles.scoreIcon, { backgroundColor: '#77C3EC20' }]}>
                  <AlertTriangle size={16} color="#77C3EC" />
                </View>
                <Text style={styles.miniLabel}>Safety</Text>
                <Text style={[styles.miniValue, { color: '#77C3EC' }]}>{product.analysis.safety_score}</Text>
              </View>
              <View style={styles.miniScore}>
                <View style={[styles.scoreIcon, { backgroundColor: '#FFAB7620' }]}>
                  <Package size={16} color="#FFAB76" />
                </View>
                <Text style={styles.miniLabel}>Value</Text>
                <Text style={[styles.miniValue, { color: '#FFAB76' }]}>{product.analysis.value_score}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* AI Summary Section */}
      {product.analysis?.summary && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
              AI Summary
            </Text>
          </View>
          <View style={styles.dataContainer}>
            <Text style={styles.summaryText}>{product.analysis.summary}</Text>
          </View>
        </View>
      )}

      {/* Clean Warnings Section */}
      {product.analysis?.warnings && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={theme.colors.warning} />
            <Text style={[styles.sectionTitle, { color: theme.colors.warning }]}>
              AI Analysis Notes
            </Text>
          </View>
          <View style={styles.dataContainer}>
            <Text style={styles.warningText}>
              {Array.isArray(product.analysis.warnings) 
                ? product.analysis.warnings.join(' ')
                : product.analysis.warnings}
            </Text>
          </View>
        </View>
      )}

      {/* Metadata Section */}
      {product._meta && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={theme.colors.textMuted} />
            <Text style={styles.sectionTitle}>Extraction Details</Text>
          </View>
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>OCR Attempted:</Text>
              <Text style={styles.metaValue}>
                {product._meta.ocrTried ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Images Processed:</Text>
              <Text style={styles.metaValue}>
                {product._meta.ocrCandidates?.total || 0}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Source:</Text>
              <Text style={styles.metaValue}>
                {product._meta.ingredients_source || 'none'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {!product.analysis && onAnalyzeWithAI && (
          <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyzeWithAI}>
            <LinearGradient
              colors={[theme.colors.primary, '#FF8E8E']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Analyze with AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {onAddToStack && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onAddToStack}>
            <Text style={styles.secondaryButtonText}>Add to Stack</Text>
          </TouchableOpacity>
        )}

        {onFindAlternatives && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onFindAlternatives}>
            <Text style={styles.secondaryButtonText}>Find Alternatives</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  dataContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  ingredient: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  moreText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  noDataSubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  factsText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: theme.spacing.xs,
  },
  metaContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  metaLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  metaValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  analyzeButton: {
    marginBottom: theme.spacing.md,
  },
  buttonGradient: {
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  analysisContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  analysisLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  analysisScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  miniScore: {
    width: '23%',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scoreIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  miniLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  miniValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  gradeBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  gradeText: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: theme.spacing.xs,
  },
  gradeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
})

