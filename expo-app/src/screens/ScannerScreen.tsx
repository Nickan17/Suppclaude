import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Search } from 'lucide-react-native'
import { theme } from '../theme'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { useNavigation } from '@react-navigation/native'
import { useStore } from '../store'
import { supabase, scoreToGrade, getGradeColor } from '../services/supabase'
import { validateSearchQuery, validateProductUrl, sanitizeInput } from '../utils/validation'
import { Analytics } from '../services/analytics'

export const ScannerScreen: React.FC = () => {
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const navigation = useNavigation()
  const { scanHistory, user } = useStore()

  const handleManualEntry = () => {
    setShowManualEntry(true)
  }

  const handleSearch = async () => {
    const validation = validateSearchQuery(searchQuery)
    if (!validation.isValid) {
      Alert.alert('Error', validation.error!)
      return
    }

    const sanitizedQuery = sanitizeInput(searchQuery)

    setIsLoading(true)
    try {
      // First search local database
      const { data: localResults, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${sanitizedQuery}%`)
        .limit(10)

      if (error) throw error

      if (localResults && localResults.length > 0) {
        // Show search results
        setSearchResults(localResults)
        Analytics.trackSearchPerformed(sanitizedQuery, localResults.length, user?.id)
      } else {
        // No local results, search web (implement web search API call here)
        Analytics.trackSearchPerformed(sanitizedQuery, 0, user?.id)
        Alert.alert('No Results', 'Product not found in our database. Try scanning the barcode instead.')
      }
    } catch (error) {
      console.error('Search error:', error)
      Alert.alert('Search Failed', 'Unable to search products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlSubmit = async () => {
    const validation = validateProductUrl(productUrl)
    if (!validation.isValid) {
      Alert.alert('Error', validation.error!)
      return
    }

    setIsLoading(true)
    try {
      // Call the extract-supplement edge function
      const response = await supabase.functions.invoke('extract-supplement', {
        body: { url: productUrl }
      })

      if (response.error) throw response.error

      const { product } = response.data
      if (product) {
        setShowManualEntry(false)
        navigation.navigate('ScoreDisplay' as never, { productId: product.id } as never)
      }
    } catch (error) {
      console.error('URL analysis error:', error)
      Alert.alert('Analysis Failed', 'Unable to analyze this product URL. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const recentScans = scanHistory.slice(0, 3)

  return (
    <SafeAreaView style={styles.container}>
      <BarcodeScanner onManualEntry={handleManualEntry} />

      {/* Recent Scans Overlay */}
      {recentScans.length > 0 && (
        <View style={styles.recentScansOverlay}>
          <Text style={styles.recentTitle}>Recent Scans</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentScans.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.recentCard}
                onPress={() => navigation.navigate('ScoreDisplay' as never, { productId: product.id } as never)}
              >
                <Text style={styles.recentName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.recentScore}>
                  {product.overall_score || '--'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualEntry(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Entry</Text>
              <TouchableOpacity onPress={() => setShowManualEntry(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search by Name */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Search by Name</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g., Optimum Nutrition Whey"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity 
                  style={styles.searchButton} 
                  onPress={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Search size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.resultCard}
                      onPress={() => {
                        setShowManualEntry(false)
                        navigation.navigate('ScoreDisplay' as never, { productId: item.id } as never)
                      }}
                    >
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.resultBrand}>{item.brand}</Text>
                      </View>
                      <View style={styles.resultScore}>
                        <Text style={[
                          styles.resultGrade,
                          { color: getGradeColor(scoreToGrade(item.overall_score || 0)) }
                        ]}>
                          {scoreToGrade(item.overall_score || 0)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.resultsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Or Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* URL Entry */}
            <View style={styles.urlSection}>
              <Text style={styles.sectionTitle}>Paste Product URL</Text>
              <TextInput
                style={styles.urlInput}
                placeholder="https://..."
                value={productUrl}
                onChangeText={setProductUrl}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                onPress={handleUrlSubmit}
                disabled={!productUrl || isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    productUrl && !isLoading
                      ? [theme.colors.primary, '#FF8E8E']
                      : [theme.colors.border, theme.colors.border]
                  }
                  style={styles.analyzeButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.analyzeButtonText}>Analyze Product</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  recentScansOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
  },
  recentTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: 'white',
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  recentCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginRight: theme.spacing.sm,
    minWidth: 120,
  },
  recentName: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  recentScore: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.textMuted,
    padding: theme.spacing.xs,
  },
  searchSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.surface,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  urlSection: {
    marginBottom: theme.spacing.xl,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  searchResultsSection: {
    marginBottom: theme.spacing.lg,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  resultInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  resultName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  resultBrand: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
  },
  resultScore: {
    alignItems: 'center',
  },
  resultGrade: {
    fontSize: 20,
    fontWeight: '700',
  },
})
