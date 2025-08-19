import { create } from 'zustand'
import { supabase, type Profile, type Product, type UserProduct } from '../services/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CacheService } from '../services/cache'
import { Analytics } from '../services/analytics'

interface AppState {
  // User state
  user: any | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Products state
  scanHistory: Product[]
  myStack: UserProduct[]
  currentProduct: Product | null
  alternatives: any[]
  
  // UI state
  onboardingStep: number
  scanCount: number
  
  // Actions
  setUser: (user: any) => void
  setProfile: (profile: Profile) => void
  setIsLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadUserData: () => Promise<void>
  scanProduct: (barcode: string) => Promise<Product>
  addToStack: (productId: string) => Promise<void>
  removeFromStack: (productId: string) => Promise<void>
  updateOnboardingStep: (step: number) => void
  completeOnboarding: (data: any) => Promise<void>
  loadScanHistory: () => Promise<void>
  loadMyStack: () => Promise<void>
  findAlternatives: (productId: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  scanHistory: [],
  myStack: [],
  currentProduct: null,
  alternatives: [],
  onboardingStep: 0,
  scanCount: 0,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setProfile: (profile) => set({ profile }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      set({ user: data.user, isAuthenticated: true })
      await get().loadUserData()
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  signup: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            onboarding_completed: false,
          })
        
        if (profileError) throw profileError
        
        set({ 
          user: data.user, 
          isAuthenticated: true,
          profile: {
            id: data.user.id,
            email: data.user.email,
            onboarding_completed: false,
          } as Profile
        })
      }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
  logout: async () => {
    await supabase.auth.signOut()
    await AsyncStorage.clear()
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      scanHistory: [],
      myStack: [],
    })
  },
  
  loadUserData: async () => {
    const { user } = get()
    if (!user) return
    
    try {
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        set({ profile })
      }
      
      // Load scan history and stack
      await Promise.all([
        get().loadScanHistory(),
        get().loadMyStack(),
      ])
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  },
  
  scanProduct: async (barcode) => {
    set({ isLoading: true })
    try {
      const { user } = get()
      
      // Check cache first
      const cachedProduct = await CacheService.getProductByBarcode(barcode)
      if (cachedProduct) {
        set({ 
          currentProduct: cachedProduct,
          scanCount: get().scanCount + 1
        })
        return cachedProduct
      }
      
      // Call edge function
      const response = await supabase.functions.invoke('extract-supplement', {
        body: { barcode, user_id: user?.id }
      })
      
      if (response.error) throw response.error
      
      const { product, alternatives } = response.data
      
      // Cache the result
      await CacheService.setProductByBarcode(barcode, product)
      
      // Track analytics
      Analytics.trackProductScanned(barcode, true, user?.id)
      Analytics.trackProductAnalyzed(product.id, product.overall_score, Date.now(), user?.id)
      
      set({ 
        currentProduct: product,
        alternatives,
        scanCount: get().scanCount + 1
      })
      
      // Add to scan history
      if (user) {
        await supabase
          .from('user_products')
          .upsert({
            user_id: user.id,
            product_id: product.id,
            scanned_at: new Date().toISOString()
          })
      }
      
      // Update scan count in profile
      if (get().profile) {
        await supabase
          .from('profiles')
          .update({ scan_count: get().scanCount })
          .eq('id', user.id)
      }
      
      return product
    } catch (error) {
      console.error('Scan error:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  
    addToStack: async (productId) => {
    const { user } = get()
    if (!user) return

    try {
      await supabase
        .from('user_products')
        .update({ is_owned: true })
        .eq('user_id', user.id)
        .eq('product_id', productId)
      
      // Track analytics
      Analytics.trackProductAddedToStack(productId, user.id)
      
      await get().loadMyStack()
    } catch (error) {
      console.error('Error adding to stack:', error)
      Analytics.trackError(error as Error, 'addToStack', user?.id)
      throw error
    }
  },
  
  removeFromStack: async (productId) => {
    const { user } = get()
    if (!user) return
    
    try {
      await supabase
        .from('user_products')
        .update({ is_owned: false })
        .eq('user_id', user.id)
        .eq('product_id', productId)
      
      await get().loadMyStack()
    } catch (error) {
      console.error('Error removing from stack:', error)
    }
  },
  
  updateOnboardingStep: (step) => set({ onboardingStep: step }),
  
  completeOnboarding: async (data) => {
    const { user } = get()
    if (!user) return
    
    try {
      console.log('Store: completeOnboarding called for user:', user.id)
      
      // Check if this is a demo user (ID starts with 'demo-user')
      const isDemoUser = user.id.toString().startsWith('demo-user')
      
      if (!isDemoUser) {
        // For real users, update the database
        const { error } = await supabase
          .from('profiles')
          .update({
            ...data,
            onboarding_completed: true,
            onboarding_responses: data,
          })
          .eq('id', user.id)
        
        if (error) throw error
      } else {
        console.log('Demo user detected, skipping database update')
      }
      
      // Track analytics
      Analytics.trackOnboardingCompleted(user.id)
      
      // Update local state regardless of user type
      set({ 
        profile: { ...get().profile!, ...data, onboarding_completed: true },
        onboardingStep: 0 
      })
      
      console.log('Store: onboarding completed successfully')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      Analytics.trackError(error as Error, 'completeOnboarding', user?.id)
      throw error
    }
  },
  
  loadScanHistory: async () => {
    const { user } = get()
    if (!user) return

    // Skip for demo users to avoid invalid UUID errors
    if (user.id.toString().startsWith('demo-user')) {
      console.log('Demo user detected, skipping loadScanHistory DB query')
      return
    }
    
    try {
      const { data } = await supabase
        .from('user_products')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(50)
      
      if (data) {
        const products = data.map(item => item.products).filter(Boolean)
        set({ scanHistory: products })
      }
    } catch (error) {
      console.error('Error loading scan history:', error)
    }
  },
  
  loadMyStack: async () => {
    const { user } = get()
    if (!user) return

    // Skip for demo users
    if (user.id.toString().startsWith('demo-user')) {
      console.log('Demo user detected, skipping loadMyStack DB query')
      return
    }
    
    try {
      const { data } = await supabase
        .from('user_products')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .eq('is_owned', true)
        .order('scanned_at', { ascending: false })
      
      if (data) {
        set({ myStack: data })
      }
    } catch (error) {
      console.error('Error loading stack:', error)
    }
  },
  
  findAlternatives: async (productId) => {
    try {
      const { user } = get()
      const response = await supabase.functions.invoke('analyze-product', {
        body: { product_id: productId, user_id: user?.id, deep_analysis: true }
      })
      
      if (response.error) throw response.error
      
      set({ alternatives: response.data.alternatives })
    } catch (error) {
      console.error('Error finding alternatives:', error)
    }
  },
}))

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  useStore.getState().setUser(session?.user || null)
  if (session?.user) {
    useStore.getState().loadUserData()
  }
})
