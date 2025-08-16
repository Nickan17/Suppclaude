import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const CACHE_PREFIX = 'supp_cache_'

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = CACHE_PREFIX + key
      const cached = await AsyncStorage.getItem(cacheKey)
      
      if (!cached) return null
      
      const item: CacheItem<T> = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() > item.expiresAt) {
        await AsyncStorage.removeItem(cacheKey)
        return null
      }
      
      return item.data
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set<T>(key: string, data: T, customDuration?: number): Promise<void> {
    try {
      const cacheKey = CACHE_PREFIX + key
      const duration = customDuration || CACHE_DURATION
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
      }
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(item))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      const cacheKey = CACHE_PREFIX + key
      await AsyncStorage.removeItem(cacheKey)
    } catch (error) {
      console.error('Cache remove error:', error)
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
      await AsyncStorage.multiRemove(cacheKeys)
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  static async getProductByBarcode(barcode: string) {
    return this.get(`product_${barcode}`)
  }

  static async setProductByBarcode(barcode: string, product: any) {
    return this.set(`product_${barcode}`, product)
  }

  static async getSearchResults(query: string) {
    return this.get(`search_${query.toLowerCase()}`)
  }

  static async setSearchResults(query: string, results: any[]) {
    // Cache search results for shorter duration (1 hour)
    return this.set(`search_${query.toLowerCase()}`, results, 60 * 60 * 1000)
  }

  static async getUserProfile(userId: string) {
    return this.get(`profile_${userId}`)
  }

  static async setUserProfile(userId: string, profile: any) {
    return this.set(`profile_${userId}`, profile)
  }

  // Cache with size limit
  static async getCacheInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
      
      let totalSize = 0
      const items = []
      
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key)
        if (item) {
          const size = new Blob([item]).size
          totalSize += size
          items.push({
            key: key.replace(CACHE_PREFIX, ''),
            size,
            timestamp: JSON.parse(item).timestamp
          })
        }
      }
      
      return {
        totalItems: cacheKeys.length,
        totalSize,
        items: items.sort((a, b) => b.timestamp - a.timestamp)
      }
    } catch (error) {
      console.error('Cache info error:', error)
      return { totalItems: 0, totalSize: 0, items: [] }
    }
  }

  // Clean up expired items
  static async cleanup() {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
      const now = Date.now()
      
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key)
        if (item) {
          const cached: CacheItem<any> = JSON.parse(item)
          if (now > cached.expiresAt) {
            await AsyncStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }
}

// Auto cleanup on app start
export const initializeCache = async () => {
  await CacheService.cleanup()
}
