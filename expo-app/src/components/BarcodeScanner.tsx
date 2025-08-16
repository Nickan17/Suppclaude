import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native'
import { Camera, CameraType } from 'expo-camera'
import { BarCodeScanner } from 'expo-barcode-scanner'
import * as Haptics from 'expo-haptics'
import { theme } from '../theme'
import { useStore } from '../store'
import { useNavigation } from '@react-navigation/native'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

interface BarcodeScannerProps {
  onScan?: (barcode: string) => void
  onManualEntry?: () => void
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onManualEntry,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const navigation = useNavigation()
  const { scanProduct } = useStore()

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!isScanning || isProcessing) return

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    setIsScanning(false)
    setIsProcessing(true)

    try {
      if (onScan) {
        onScan(data)
      } else {
        // Default behavior: scan product
        const product = await scanProduct(data)
        navigation.navigate('ScoreDisplay' as never, { productId: product.id } as never)
      }
    } catch (error) {
      Alert.alert(
        'Scan Failed',
        'Unable to find this product. Try searching manually.',
        [
          { text: 'Try Again', onPress: () => setIsScanning(true) },
          { text: 'Manual Entry', onPress: () => onManualEntry?.() },
        ]
      )
    } finally {
      setIsProcessing(false)
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        type={CameraType.back}
        onBarCodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.ean13, BarCodeScanner.Constants.BarCodeType.ean8, BarCodeScanner.Constants.BarCodeType.upc_a, BarCodeScanner.Constants.BarCodeType.upc_e],
        }}
      />
      
      {/* Scan frame overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          {/* Scanning line animation */}
          {isScanning && !isProcessing && (
            <View style={styles.scanLine} />
          )}
        </View>
        
        <Text style={styles.instructionText}>
          {isProcessing ? 'Processing...' : 'Position barcode within frame'}
        </Text>
        
        {isProcessing && (
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary} 
            style={styles.loader}
          />
        )}
      </View>
      
      {/* Manual entry button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={onManualEntry}
          disabled={isProcessing}
        >
          <Text style={styles.manualButtonText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: theme.radii.lg,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: theme.radii.lg,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: theme.radii.lg,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: theme.radii.lg,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: theme.radii.lg,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: theme.colors.primary,
    top: '50%',
    opacity: 0.8,
  },
  instructionText: {
    marginTop: theme.spacing.xl,
    fontSize: theme.typography.body.fontSize,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  loader: {
    marginTop: theme.spacing.lg,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.full,
  },
  manualButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.full,
  },
  buttonText: {
    color: 'white',
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
})
