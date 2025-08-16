import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { theme } from '../theme'
import { useStore } from '../store'
import { scoreToGrade, getGradeColor } from '../services/supabase'

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation()
  const { scanHistory, loadScanHistory, myStack } = useStore()
  const [refreshing, setRefreshing] = React.useState(false)
  const [filter, setFilter] = React.useState<'all' | 'stack'>('all')

  useEffect(() => {
    loadScanHistory()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadScanHistory()
    setRefreshing(false)
  }

  const displayData = filter === 'all' 
    ? scanHistory 
    : scanHistory.filter(p => myStack.some((s: any) => s.product_id === p.id))

  const renderProduct = ({ item }: { item: any }) => {
    const grade = scoreToGrade(item.overall_score || 0)
    const gradeColor = getGradeColor(grade)
    const isInStack = myStack.some((s: any) => s.product_id === item.id)

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ScoreDisplay' as never, { productId: item.id } as never)}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.productBrand} numberOfLines={1}>
              {item.brand}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.grade, { color: gradeColor }]}>{grade}</Text>
            <Text style={styles.score}>{item.overall_score || '--'}</Text>
          </View>
        </View>
        
        <View style={styles.productFooter}>
          <View style={styles.scoresRow}>
            <View style={styles.subScore}>
              <Text style={styles.subScoreLabel}>Purity</Text>
              <Text style={styles.subScoreValue}>{item.purity_score || '--'}</Text>
            </View>
            <View style={styles.subScore}>
              <Text style={styles.subScoreLabel}>Efficacy</Text>
              <Text style={styles.subScoreValue}>{item.efficacy_score || '--'}</Text>
            </View>
            <View style={styles.subScore}>
              <Text style={styles.subScoreLabel}>Safety</Text>
              <Text style={styles.subScoreValue}>{item.safety_score || '--'}</Text>
            </View>
            <View style={styles.subScore}>
              <Text style={styles.subScoreLabel}>Value</Text>
              <Text style={styles.subScoreValue}>{item.value_score || '--'}</Text>
            </View>
          </View>
          {isInStack && (
            <View style={styles.stackBadge}>
              <Text style={styles.stackBadgeText}>In Stack</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📊</Text>
      <Text style={styles.emptyTitle}>No scans yet</Text>
      <Text style={styles.emptyText}>
        Start scanning supplements to see their analysis here
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Scans ({scanHistory.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'stack' && styles.filterTabActive]}
          onPress={() => setFilter('stack')}
        >
          <Text style={[styles.filterText, filter === 'stack' && styles.filterTextActive]}>
            My Stack ({myStack.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  productInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  productName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  productBrand: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  grade: {
    fontSize: 24,
    fontWeight: '700',
  },
  score: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoresRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  subScore: {
    alignItems: 'center',
  },
  subScoreLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  subScoreValue: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  stackBadge: {
    backgroundColor: theme.colors.secondary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  stackBadgeText: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
})
