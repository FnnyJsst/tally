import { View, StyleSheet } from 'react-native'
import Svg, { Path, Rect, G } from 'react-native-svg'

function EtsyLogo({ size = 24 }: { size?: number }) {
  // Official Etsy "E" wordmark in orange
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50">
      <Path
        d="M25 2C12.3 2 2 12.3 2 25s10.3 23 23 23 23-10.3 23-23S37.7 2 25 2zm0 4c10.5 0 19 8.5 19 19S35.5 44 25 44 6 35.5 6 25 14.5 6 25 6zm-6 8v22h12v-3.5h-8v-6h7v-3.5h-7v-5.5h8V14H19z"
        fill="#F56400"
      />
    </Svg>
  )
}

function ShopifyLogo({ size = 24 }: { size?: number }) {
  // Shopify bag icon in green
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50">
      <Path
        d="M33.3 12.1c-.1-.1-.3-.1-.4-.1-.2 0-3.3-.2-3.3-.2s-2.2-2.2-2.5-2.4c-.2-.2-.7-.2-.9-.1L25 9.6 23.9 9c-.8-2.4-2.2-4.6-4.6-4.6h-.2C18.4 3.6 17.7 3 17 3c-5.6 0-8.3 7-9.1 10.5L4 14.9C3 15.2 3 15.2 2.9 16.1L0 36l21.7 4.1 12-2.6 1.6-5.5c0 0 2.9-19.5 2.9-19.7-.1-.2-.7-.2-.9-.2zM25.7 10l-1.5.4-.7-2.1c.4-.1.7-.2.9-.2.5 1 .9 1.3 1.3 1.9zm-3.4.9l-3.5 1s.9-3.5 2.3-5.2l1.2 4.2zm-1.2-5.7c.2 0 .5.2.7.5-1.7 2-2.9 5.2-3.2 6.7l-2.8.8c.8-2.8 2.7-8 5.3-8z"
        fill="#96BF48"
      />
      <Path
        d="M32.9 12c-.2 0-3.3-.2-3.3-.2s-2.2-2.2-2.5-2.4c-.1-.1-.2-.1-.3-.1l-1.5 30.8 12-2.6s-4.2-25.3-4.2-25.5c-.1 0-.2 0-.2 0z"
        fill="#5E8E3E"
      />
      <Path
        d="M19.1 18.5l-1.5 4.4s-1.3-.7-2.9-.7c-2.3 0-2.4 1.4-2.4 1.8 0 2 5.3 2.7 5.3 7.3 0 3.6-2.3 5.9-5.4 5.9-3.7 0-5.6-2.3-5.6-2.3l1-3.3s2 1.7 3.6 1.7c1.1 0 1.5-.9 1.5-1.5 0-2.6-4.3-2.7-4.3-6.9 0-3.5 2.5-7 7.6-7 2 0 3.1.6 3.1.6z"
        fill="#FFFFFF"
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
