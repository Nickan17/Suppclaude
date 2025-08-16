import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react-native'
import { theme } from '../theme'
import { useStore } from '../store'

export const ProfileScreen: React.FC = () => {
  const { profile, logout, myStack, scanHistory } = useStore()

  const calculateMonthlySpend = () => {
    if (!myStack.length) return 0
    return myStack.reduce((total: number, item: any) => {
      if (item.products?.price_per_serving && item.products?.servings_per_container) {
        const monthlyServings = 30 // Assuming daily use
        const containersPerMonth = monthlyServings / item.products.servings_per_container
        return total + (item.products.price_usd * containersPerMonth)
      }
      return total
    }, 0)
  }

  const calculateAverageScore = () => {
    if (!myStack.length) return 0
    const totalScore = myStack.reduce((sum: number, item: any) => 
      sum + (item.products?.overall_score || 0), 0
    )
    return Math.round(totalScore / myStack.length)
  }

  const calculateSavingsPotential = () => {
    // Mock calculation - in real app, would compare with alternatives
    const currentSpend = calculateMonthlySpend()
    return Math.round(currentSpend * 0.25) // Assume 25% savings potential
  }

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    )
  }

  const stats = [
    {
      icon: TrendingUp,
      label: 'Stack Score',
      value: `${calculateAverageScore()}`,
      color: theme.colors.secondary,
    },
    {
      icon: DollarSign,
      label: 'Monthly Spend',
      value: `$${calculateMonthlySpend().toFixed(0)}`,
      color: theme.colors.warning,
    },
    {
      icon: Target,
      label: 'Products Scanned',
      value: `${scanHistory.length}`,
      color: theme.colors.primary,
    },
  ]

  const menuItems = [
    { label: 'Edit Profile', icon: Settings, onPress: () => {} },
    { label: 'Subscription', icon: DollarSign, onPress: () => {} },
    { label: 'Privacy Policy', icon: ChevronRight, onPress: () => {} },
    { label: 'Terms of Service', icon: ChevronRight, onPress: () => {} },
    { label: 'Contact Support', icon: ChevronRight, onPress: () => {} },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.email?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.email}>{profile?.email}</Text>
        <Text style={styles.memberSince}>
          Member since {new Date(profile?.created_at || '').toLocaleDateString()}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <stat.icon size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Savings Potential */}
      <TouchableOpacity activeOpacity={0.8}>
        <LinearGradient
          colors={[theme.colors.primary, '#FF8E8E']}
          style={styles.savingsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View>
            <Text style={styles.savingsTitle}>Potential Monthly Savings</Text>
            <Text style={styles.savingsAmount}>${calculateSavingsPotential()}</Text>
          </View>
          <Text style={styles.savingsAction}>View Alternatives →</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Goals */}
      {profile?.goals && profile.goals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          <View style={styles.goalsContainer}>
            {profile.goals.map((goal, index) => (
              <View key={index} style={styles.goalChip}>
                <Text style={styles.goalText}>{goal.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <item.icon size={20} color={theme.colors.textMuted} />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={theme.colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
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
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  email: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  memberSince: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  savingsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.xs,
  },
  savingsAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  savingsAction: {
    fontSize: theme.typography.caption.fontSize,
    color: 'white',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  goalChip: {
    backgroundColor: theme.colors.secondary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
  },
  goalText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.secondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  menuContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuItemText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  logoutText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.danger,
    fontWeight: '500',
  },
})
