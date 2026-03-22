import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

const logo = require('@/assets/images/logo.png');

/**
 * TestGen logo mark.
 * Renders at a 4:5 aspect ratio (width = size * 0.8, height = size).
 */
export function LogoMark({ size = 48 }: Props) {
  return (
    <Image
      source={logo}
      style={{ width: size * 0.8, height: size }}
      resizeMode="contain"
    />
  );
}
