import { View, StyleSheet } from 'react-native'
import Svg, { Path, Rect, G } from 'react-native-svg'

function EtsyLogo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50">
      {/* Orange circle */}
      <Path
        d="M25 2C12.3 2 2 12.3 2 25s10.3 23 23 23 23-10.3 23-23S37.7 2 25 2z"
        fill="#F56400"
      />
      {/* White E letterform */}
      <Path
        d="M19 14v22h12v-3.5h-8v-6h7v-3.5h-7v-5.5h8V14H19z"
        fill="white"
      />
    </Svg>
  )
}

function ShopifyLogo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50">
      <Rect width="50" height="50" rx="8" fill="#95BF47" />
      {/* Shopping bag: body + handle arch */}
      <Path
        d="M11,24 L18,24 C18,14 32,14 32,24 L39,24 L39,43 L11,43 Z"
        fill="white"
      />
    </Svg>
  )
}

function WooCommerceLogo({ size = 24 }: { size?: number }) {
  // WooCommerce "W" icon on purple background
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50">
      <Rect width="50" height="50" rx="8" fill="#7F54B3" />
      <Path
        d="M5 15c-1 0-1.7.5-1.8 1.4L0 32.5c-.1.9.5 1.6 1.5 1.6h.4l3.5-8.7 3.5 8.7h2.4l3.8-8.6 1.4 8.6h3.2c.9 0 1.7-.7 1.5-1.6l-2.8-16.1c-.2-.9-.9-1.4-1.8-1.4-1.1 0-1.8.6-2.3 1.8l-3.3 7.5-3.3-7.5C7 15.6 6.1 15 5 15zm22 0c-1 0-1.7.5-1.8 1.4l-2.9 16.1c-.1.9.5 1.6 1.5 1.6h.4l3.5-8.7 3.5 8.7h2.4l3.8-8.6 1.4 8.6h3.2c.9 0 1.7-.7 1.5-1.6l-2.8-16.1c-.2-.9-.9-1.4-1.8-1.4-1.1 0-1.8.6-2.3 1.8l-3.3 7.5-3.3-7.5c-.4-1.2-1.2-1.8-2.3-1.8z"
        fill="white"
        transform="translate(4, 4) scale(0.84)"
      />
    </Svg>
  )
}

type ChannelType = 'etsy' | 'shopify' | 'woocommerce' | 'physical' | 'market' | 'other'

export const BRAND_CHANNEL_TYPES: ChannelType[] = ['etsy', 'shopify', 'woocommerce']

const BRAND_BG: Record<string, string> = {
  etsy: '#FFF3EC',
  shopify: '#F0F7E6',
  woocommerce: '#F3EEFF',
}

const BRAND_BORDER: Record<string, string> = {
  etsy: '#F5640025',
  shopify: '#96BF4825',
  woocommerce: '#7F54B325',
}

export function ChannelLogo({ type, size = 40 }: { type: ChannelType; size?: number }) {
  const logoSize = Math.round(size * 0.6)

  const logo = (() => {
    if (type === 'etsy') return <EtsyLogo size={logoSize} />
    if (type === 'shopify') return <ShopifyLogo size={logoSize} />
    if (type === 'woocommerce') return <WooCommerceLogo size={logoSize} />
    return null
  })()

  if (!logo) return null

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        backgroundColor: BRAND_BG[type],
        borderColor: BRAND_BORDER[type],
      }
    ]}>
      {logo}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
})
