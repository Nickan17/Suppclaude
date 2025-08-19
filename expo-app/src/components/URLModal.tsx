import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { theme } from '../theme'
import { useStore } from '../store'

interface URLModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (product: any) => void
}

export const URLModal: React.FC<URLModalProps> = ({ visible, onClose, onSuccess }) => {
  const { user } = useStore()
  const [urlInput, setUrlInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  const handleAnalysis = async () => {
    if (!urlInput.trim()) {
      Alert.alert('Error', 'Please enter a valid URL')
      return
    }

    if (!validateUrl(urlInput.trim())) {
      Alert.alert('Error', 'Please enter a valid URL starting with http:// or https://')
      return
    }

    setIsAnalyzing(true)
    try {
      console.log('Starting URL analysis with firecrawl-extract function...')
      
      // Get environment variables
      const EXTRACT_FN_URL = process.env.EXPO_PUBLIC_EXTRACT_FN_URL || 
                             `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/firecrawl-extract`
      const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

      if (!EXTRACT_FN_URL || !ANON_KEY) {
        throw new Error('Missing environment configuration')
      }

      // Call the firecrawl-extract function
      const response = await fetch(EXTRACT_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ url: urlInput.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Extract function error:', data)
        
        if (response.status === 422 && data.error === 'empty_parse') {
          Alert.alert(
            'Unable to Extract Information',
            data.message || 'Could not find supplement information on this page. Please try a different URL or use the barcode scanner.',
          )
        } else if (response.status === 400) {
          Alert.alert('Error', data.message || 'Invalid request. Please check the URL and try again.')
        } else if (response.status === 502) {
          Alert.alert('Service Error', data.message || 'External service temporarily unavailable. Please try again later.')
        } else {
          Alert.alert('Error', 'Failed to analyze the URL. Please try again.')
        }

        // Log metadata for debugging
        if (data._meta) {
          console.log('Extract metadata:', data._meta)
        }
        
        setIsAnalyzing(false)
        return
      }

      console.log('URL analysis successful:', data)
      console.log('Metadata:', data._meta)

      setUrlInput('')
      setIsAnalyzing(false)
      onClose()
      onSuccess(data)
      
    } catch (error) {
      console.error('URL analysis error:', error)
      Alert.alert('Network Error', 'Failed to connect to analysis service. Please check your connection and try again.')
      setIsAnalyzing(false)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString()
      if (clipboardContent && (clipboardContent.startsWith('http') || clipboardContent.includes('.'))) {
        setUrlInput(clipboardContent)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else {
        Alert.alert('No URL found', 'No valid URL found in clipboard')
      }
    } catch (error) {
      console.error('Clipboard error:', error)
      Alert.alert('Error', 'Unable to access clipboard')
    }
  }

  const handleClose = () => {
    setUrlInput('')
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Analyze Product URL</Text>
          <TouchableOpacity 
            onPress={handleAnalysis}
            disabled={isAnalyzing || !urlInput.trim()}
            style={[styles.analyzeButton, (!urlInput.trim() || isAnalyzing) && styles.analyzeButtonDisabled]}
          >
            <Text style={[styles.analyzeText, (!urlInput.trim() || isAnalyzing) && styles.analyzeTextDisabled]}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.label}>Product URL</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="https://amazon.com/product/..."
              value={urlInput}
              onChangeText={setUrlInput}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.textMuted}
            />
            <TouchableOpacity 
              onPress={pasteFromClipboard}
              style={styles.pasteButton}
            >
              <Text style={styles.pasteButtonText}>📋 Paste</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Supports Amazon, iHerb, Bodybuilding.com, and most supplement retailers
          </Text>
          
          {/* Quick examples */}
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Supported sites:</Text>
            <View style={styles.examplesList}>
              <Text style={styles.exampleItem}>• Amazon.com</Text>
              <Text style={styles.exampleItem}>• iHerb.com</Text>
              <Text style={styles.exampleItem}>• Bodybuilding.com</Text>
              <Text style={styles.exampleItem}>• Vitacost.com</Text>
              <Text style={styles.exampleItem}>• A1Supplements.com</Text>
              <Text style={styles.exampleItem}>• Most supplement retailers</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeText: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  analyzeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  analyzeButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  analyzeText: {
    color: 'white',
    fontWeight: '600',
  },
  analyzeTextDisabled: {
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  pasteButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  pasteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xl,
  },
  examplesContainer: {
    marginTop: theme.spacing.lg,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  examplesList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  exampleItem: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
})
