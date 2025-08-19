import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import { theme } from '../theme'
import { ScoreDisplay } from '../components/ScoreDisplay'
import { BasicProductDisplay } from '../components/BasicProductDisplay'
import { useStore } from '../store'
import { supabase } from '../services/supabase'

export const ScoreDisplayScreen: React.FC = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { productId, product: routeProduct } = route.params as { productId?: string; product?: any }
  const { addToStack, findAlternatives } = useStore()
  
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (routeProduct) {
      setProduct(routeProduct)
      setIsLoading(false)
    } else if (productId) {
      loadProduct()
    } else {
      // No product data, return to previous screen
      navigation.goBack()
    }
  }, [productId, routeProduct])

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToStack = async () => {
    try {
      await addToStack(productId)
      
      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Added to Stack! 💪',
        text2: 'Product added to your supplement stack',
        position: 'bottom',
      })
    } catch (error) {
      // Error feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: 'Failed to Add',
        text2: 'Please try again',
        position: 'bottom',
      })
      console.error('Error adding to stack:', error)
    }
  }

  const handleFindAlternatives = async () => {
    await findAlternatives(productId)
    navigation.navigate('Alternatives' as never, { productId } as never)
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  // Use BasicProductDisplay for products without scores
  const hasScore = (product?.overall_score && product.overall_score > 0) || 
                   (product?.analysis?.overall_score && product.analysis.overall_score > 0)
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {hasScore ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ScoreDisplay
            product={product}
            onAddToStack={handleAddToStack}
            onFindAlternatives={handleFindAlternatives}
          />
        </ScrollView>
      ) : (
        <BasicProductDisplay
          product={product}
          onAddToStack={handleAddToStack}
          onFindAlternatives={handleFindAlternatives}
        />
      )}
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
    backgroundColor: theme.colors.background,
  },
})
