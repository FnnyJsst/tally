// ─── Light (new violet identity) ────────────────────────────────────────────
export const lightColors = {
  bg:          '#F4F5F7',
  surface:     '#FFFFFF',
  surface2:    '#EDEEF2',
  border:      'rgba(0,0,0,0.07)',
  border2:     'rgba(0,0,0,0.04)',
  text:        '#18161F',
  text2:       '#5A566A',
  text3:       '#9E9AAE',
  accent:      '#FF8D50',
  accentLight: '#EEE8F8',
  green:       'rgba(59, 172, 138, 0.85)',
  greenBg:     'rgba(226, 245, 239, 0.85)',
  greenBorder: 'rgba(58,122,90,0.2)',
  red:         'rgba(245, 73, 70, 0.85)',
  redBg:       'rgba(245, 229, 229, 0.85)',
  redBorder:   'rgba(196,80,58,0.2)',
  orange:      '#e6a21a',
  orangeBg:    '#FEF3D0',
  orangeBorder:'rgba(176,122,16,0.2)',
  pill:        'rgba(0,0,0,0.06)',
  pillBorder:  'rgba(0,0,0,0.10)',
}

// ─── Dark (aurora glassmorphism) ─────────────────────────────────────────────
export const darkColors = {
  bg:          '#0D0820',
  surface:     'rgba(255,255,255,0.07)',
  surface2:    'rgba(255,255,255,0.04)',
  border:      'rgba(255,255,255,0.12)',
  border2:     'rgba(255,255,255,0.06)',
  text:        'rgba(255,255,255,0.95)',
  text2:       'rgba(255,255,255,0.55)',
  text3:       'rgba(255,255,255,0.30)',
  accent:      '#9B7FD4',
  accentLight: 'rgba(155,127,212,0.2)',
  green:       '#50E8A0',
  greenBg:     'rgba(50,220,150,0.15)',
  greenBorder: 'rgba(50,220,150,0.2)',
  red:         '#FF7070',
  redBg:       'rgba(255,80,80,0.15)',
  redBorder:   'rgba(255,80,80,0.2)',
  orange:      '#FFB060',
  orangeBg:    'rgba(255,160,60,0.15)',
  orangeBorder:'rgba(255,160,60,0.2)',
  pill:        'rgba(255,255,255,0.10)',
  pillBorder:  'rgba(255,255,255,0.15)',
}

export const Colors = lightColors
export type ColorScheme = typeof lightColors

export const AuroraGradient = ['#9B7FD4', '#6B5FA0'] as const

export const Radius = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
}

export const Spacing = {
  xs:  6,
  sm:  10,
  md:  16,
  lg:  20,
  xl:  28,
  xxl: 36,
}

export const FontSize = {
  xs:      12,
  sm:      13,
  md:      14,
  base:    15,
  lg:      18,
  xl:      20,
  xxl:     24,
  display: 32,
}

// Fraunces font family names (loaded via @expo-google-fonts/fraunces)
export const FontFamily = {
  display: 'Open_400Regular',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_400Regular_Italic',
}
