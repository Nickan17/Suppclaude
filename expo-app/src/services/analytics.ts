import { supabase } from './supabase'

export interface AnalyticsEvent {
  event_type: string
  event_data?: any
  user_id?: string
}

export class Analytics {
  private static queue: AnalyticsEvent[] = []
  private static isOnline = true
  private static batchSize = 10
  private static flushInterval = 30000 // 30 seconds

  static init() {
    // Start periodic flush
    setInterval(() => {
      this.flush()
    }, this.flushInterval)

    // Flush on app state change
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  static track(eventType: string, properties?: any, userId?: string) {
    const event: AnalyticsEvent = {
      event_type: eventType,
      event_data: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: 'mobile',
        user_agent: navigator?.userAgent || 'unknown',
      },
      user_id: userId
    }

    // Add to queue
    this.queue.push(event)

    // Console log for development
    if (__DEV__) {
      console.log('[Analytics]', eventType, properties)
    }

    // Flush if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush()
    }
  }

  static async flush() {
    if (this.queue.length === 0 || !this.isOnline) return

    const eventsToSend = [...this.queue]
    this.queue = []

    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert(eventsToSend)

      if (error) {
        console.error('Analytics flush error:', error)
        // Re-add events to queue on failure
        this.queue.unshift(...eventsToSend)
      }
    } catch (error) {
      console.error('Analytics flush error:', error)
      // Re-add events to queue on failure
      this.queue.unshift(...eventsToSend)
    }
  }

  static setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline
    if (isOnline) {
      this.flush()
    }
  }

  // Predefined events for key user actions
  static trackProductScanned(barcode: string, found: boolean, userId?: string) {
    this.track('product_scanned', {
      barcode,
      found,
      scan_method: 'camera'
    }, userId)
  }

  static trackProductAnalyzed(productId: string, score: number, timeMs: number, userId?: string) {
    this.track('product_analyzed', {
      product_id: productId,
      overall_score: score,
      analysis_time_ms: timeMs
    }, userId)
  }

  static trackAlternativeViewed(originalId: string, alternativeId: string, userId?: string) {
    this.track('alternative_viewed', {
      original_product_id: originalId,
      alternative_product_id: alternativeId
    }, userId)
  }

  static trackProductAddedToStack(productId: string, userId?: string) {
    this.track('product_added_to_stack', {
      product_id: productId
    }, userId)
  }

  static trackSearchPerformed(query: string, resultsCount: number, userId?: string) {
    this.track('search_performed', {
      query: query.length > 50 ? query.substring(0, 50) + '...' : query, // Truncate long queries
      results_count: resultsCount,
      search_method: 'manual'
    }, userId)
  }

  static trackOnboardingStep(step: number, stepName: string, userId?: string) {
    this.track('onboarding_step', {
      step_number: step,
      step_name: stepName
    }, userId)
  }

  static trackOnboardingCompleted(userId?: string) {
    this.track('onboarding_completed', {}, userId)
  }

  static trackScreenView(screenName: string, userId?: string) {
    this.track('screen_view', {
      screen_name: screenName
    }, userId)
  }

  static trackError(error: Error, context: string, userId?: string) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Truncate stack trace
      context,
      error_name: error.name
    }, userId)
  }

  static trackFeatureUsed(featureName: string, properties?: any, userId?: string) {
    this.track('feature_used', {
      feature_name: featureName,
      ...properties
    }, userId)
  }

  static trackPerformanceMetric(metricName: string, value: number, unit: string, userId?: string) {
    this.track('performance_metric', {
      metric_name: metricName,
      value,
      unit
    }, userId)
  }

  // User journey tracking
  static trackUserJourney(step: string, metadata?: any, userId?: string) {
    this.track('user_journey', {
      journey_step: step,
      ...metadata
    }, userId)
  }

  // Conversion tracking
  static trackConversion(conversionType: string, value?: number, userId?: string) {
    this.track('conversion', {
      conversion_type: conversionType,
      value
    }, userId)
  }

  // Retention tracking
  static trackRetention(daysSinceInstall: number, userId?: string) {
    this.track('retention', {
      days_since_install: daysSinceInstall
    }, userId)
  }
}

// Initialize analytics
Analytics.init()

// Track app performance
export const trackPageLoad = (pageName: string, loadTime: number, userId?: string) => {
  Analytics.trackPerformanceMetric('page_load_time', loadTime, 'ms', userId)
  Analytics.trackScreenView(pageName, userId)
}

// Network monitoring
export const trackNetworkError = (url: string, error: string, userId?: string) => {
  Analytics.track('network_error', {
    url,
    error_message: error
  }, userId)
}

// Feature flag tracking
export const trackFeatureFlag = (flagName: string, enabled: boolean, userId?: string) => {
  Analytics.track('feature_flag', {
    flag_name: flagName,
    enabled
  }, userId)
}
