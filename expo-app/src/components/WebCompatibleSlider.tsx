import React from 'react'
import { View, Platform } from 'react-native'
import Slider from '@react-native-community/slider'

interface WebCompatibleSliderProps {
  value: number
  onValueChange: (value: number) => void
  minimumValue: number
  maximumValue: number
  step?: number
  minimumTrackTintColor?: string
  maximumTrackTintColor?: string
  thumbStyle?: any
  trackStyle?: any
  style?: any
}

export const WebCompatibleSlider: React.FC<WebCompatibleSliderProps> = (props) => {
  if (Platform.OS === 'web') {
    // Use HTML5 range input for web
    return (
      <View style={props.style}>
        <input
          type="range"
          min={props.minimumValue}
          max={props.maximumValue}
          step={props.step || 1}
          value={props.value}
          onChange={(e) => props.onValueChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: 40,
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            outline: 'none',
            opacity: 0.7,
            transition: 'opacity 0.2s',
            cursor: 'pointer',
          }}
        />
        <style>
          {`
            input[type="range"]::-webkit-slider-track {
              width: 100%;
              height: 8px;
              background: ${props.maximumTrackTintColor || '#ddd'};
              border-radius: 4px;
            }
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              background: ${props.minimumTrackTintColor || '#007AFF'};
              border-radius: 50%;
              cursor: pointer;
            }
            input[type="range"]::-moz-range-track {
              width: 100%;
              height: 8px;
              background: ${props.maximumTrackTintColor || '#ddd'};
              border-radius: 4px;
              border: none;
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              background: ${props.minimumTrackTintColor || '#007AFF'};
              border-radius: 50%;
              cursor: pointer;
              border: none;
            }
          `}
        </style>
      </View>
    )
  }

  // Use React Native Slider for native platforms
  return <Slider {...props} />
}
