import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { Leaf, Dumbbell, Shield, DollarSign } from 'lucide-react-native'
import { theme } from '../theme'
import { scoreToGrade, getGradeColor } from '../services/supabase'
import * as Haptics from 'expo-haptics'

const { width: screenWidth } = Dimensions.get('window')
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface ScoreDisplayProps {
  product: any
  onAddToStack?: () => void
  onFindAlternatives?: () => void
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  product,
  onAddToStack,
  onFindAlternatives,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const scoreAnim = useRef(new Animated.Value(0)).current
  const donutProgress = useRef(new Animated.Value(0)).current
  
  const radius = 80
  const strokeWidth = 16
  const circumference = 2 * Math.PI * radius
  // Support both direct scores and nested analysis scores
  const overallScore = product.overall_score || product.analysis?.overall_score || 0
  const purityScore = product.purity_score || product.analysis?.purity_score || 0
  const efficacyScore = product.efficacy_score || product.analysis?.efficacy_score || 0
  const safetyScore = product.safety_score || product.analysis?.safety_score || 0
  const valueScore = product.value_score || product.analysis?.value_score || 0
  
  const grade = scoreToGrade(overallScore)
  const gradeColor = getGradeColor(grade)

  useEffect(() => {
    // Trigger animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scoreAnim, {
          toValue: overallScore,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(donutProgress, {
          toValue: overallScore / 100,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]),
    ]).start()
    
    // Haptic feedback on score reveal
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  const strokeDashoffset = donutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - overallScore / 100)],
  })

  const animatedScore = scoreAnim.interpolate({
    inputRange: [0, overallScore],
    outputRange: ['0', `${overallScore}`],
  })

  const SubScore = ({ 
    icon: Icon, 
    label, 
    score, 
    color, 
    delay 
  }: { 
    icon: any, 
    label: string, 
    score: number, 
    color: string, 
    delay: number 
  }) => {
    const slideAnim = useRef(new Animated.Value(50)).current
    const opacityAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
      ]).start()
    }, [])

    return (
      <Animated.View 
        style={[
          styles.subScoreCard,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon size={24} color={color} />
        </View>
        <Text style={styles.subScoreLabel}>{label}</Text>
        <Text style={styles.subScore}>{score}</Text>
      </Animated.View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <Text style={styles.tagline}>Small progress is still progress.</Text>
        
        {/* Donut Chart */}
        <View style={styles.donutContainer}>
          <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
            <G rotation="-90" origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}>
              {/* Background circle */}
              <Circle
                cx={radius + strokeWidth / 2}
                cy={radius + strokeWidth / 2}
                r={radius}
                stroke="#F0F0F0"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Animated progress circle */}
              <AnimatedCircle
                cx={radius + strokeWidth / 2}
                cy={radius + strokeWidth / 2}
                r={radius}
                stroke={gradeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          
          <View style={styles.scoreContent}>
            <Text style={[styles.grade, { color: gradeColor }]}>{grade}</Text>
            <Animated.Text style={styles.scoreText}>
              {animatedScore.interpolate({
                inputRange: [0, overallScore],
                outputRange: ['0', `${Math.round(overallScore)}`],
              })}
            </Animated.Text>
            <Text style={styles.scoreTotal}>/ 100</Text>
          </View>
        </View>

        <Text style={styles.productName}>{product.name || product.title}</Text>
        <Text style={styles.productBrand}>{product.brand || 'Supplement Analysis'}</Text>

        {/* Sub-scores */}
        <View style={styles.subScoresContainer}>
          <SubScore
            icon={Leaf}
            label="Purity"
            score={purityScore}
            color="#4ECDC4"
            delay={600}
          />
          <SubScore
            icon={Dumbbell}
            label="Efficacy"
            score={efficacyScore}
            color="#B19CD9"
            delay={700}
          />
          <SubScore
            icon={Shield}
            label="Safety"
            score={safetyScore}
            color="#77C3EC"
            delay={800}
          />
          <SubScore
            icon={DollarSign}
            label="Value"
            score={valueScore}
            color="#FFAB76"
            delay={900}
          />
        </View>

        {/* Warnings */}
        {product.warnings && product.warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={styles.warningsTitle}>⚠️ Warnings</Text>
            {product.warnings.map((warning: string, index: number) => (
              <Text key={index} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onAddToStack}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary, '#FF8E8E']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Add to My Stack</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onFindAlternatives}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Find Better Options →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  tagline: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  scoreContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  grade: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: -10,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
  },
  scoreTotal: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  productName: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  productBrand: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
  },
  subScoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  subScoreCard: {
    width: (screenWidth - theme.spacing.lg * 3) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  subScoreLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  subScore: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
  },
  warningsContainer: {
    width: '100%',
    backgroundColor: '#FFE66D20',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  warningsTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionsContainer: {
    width: '100%',
  },
  primaryButton: {
    marginBottom: theme.spacing.md,
  },
  gradientButton: {
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
})
