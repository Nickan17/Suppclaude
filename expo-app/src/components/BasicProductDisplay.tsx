import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Beaker, Package, AlertTriangle, Sparkles } from 'lucide-react-native'
import { theme } from '../theme'

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Package size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>{product.name || product.title}</Text>
        <Text style={styles.subtitle}>Product Analysis</Text>
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
                <Text style={styles.miniLabel}>Purity</Text>
                <Text style={styles.miniValue}>{product.analysis.purity_score}</Text>
              </View>
              <View style={styles.miniScore}>
                <Text style={styles.miniLabel}>Efficacy</Text>
                <Text style={styles.miniValue}>{product.analysis.efficacy_score}</Text>
              </View>
              <View style={styles.miniScore}>
                <Text style={styles.miniLabel}>Safety</Text>
                <Text style={styles.miniValue}>{product.analysis.safety_score}</Text>
              </View>
              <View style={styles.miniScore}>
                <Text style={styles.miniLabel}>Value</Text>
                <Text style={styles.miniValue}>{product.analysis.value_score}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Clean Warnings Section */}
      {product.analysis?.warnings && typeof product.analysis.warnings === 'string' && 
       !product.analysis.warnings.includes('<') && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={theme.colors.warning} />
            <Text style={[styles.sectionTitle, { color: theme.colors.warning }]}>
              AI Analysis Notes
            </Text>
          </View>
          <View style={styles.dataContainer}>
            <Text style={styles.warningText}>{product.analysis.warnings}</Text>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
})
