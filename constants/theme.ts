import { Platform, TextStyle, ViewStyle } from 'react-native';

// ─── Color Palette (60/30/10 Rule + Opacity Hierarchy) ────────────
export const Colors = {
  light: {
    // 30% Complementary Dark Text with Opacity Hierarchy (100% / 80% / 62%)
    text: '#0F172A',
    textBody: 'rgba(15, 23, 42, 0.80)',
    textSecondary: '#475569',
    textCaption: 'rgba(15, 23, 42, 0.62)',
    textMuted: '#94A3B8',
    // 60% Neutral Surfaces
    background: '#F8FAFC',
    card: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    // 10% Brand Accent (#16A34A) + 5% Subtle Accent Highlights & Borders
    primary: '#16A34A',
    primaryLight: '#DCFCE7',
    primarySubtle: 'rgba(22, 163, 74, 0.06)',
    primaryBorderSubtle: 'rgba(22, 163, 74, 0.14)',
    primaryDark: '#15803D',
    tint: '#16A34A',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#16A34A',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#3B82F6',
    // Semantic category colors with soft solid backgrounds
    irrigation: '#2563EB',
    irrigationLight: '#EFF6FF',
    fertilizer: '#16A34A',
    fertilizerLight: '#F0FDF4',
    disease: '#D97706',
    diseaseLight: '#FFFBEB',
  },
  // Ensure dark fallback matches clean light mode if system requests it
  dark: {
    text: '#0F172A',
    textBody: 'rgba(15, 23, 42, 0.80)',
    textSecondary: '#475569',
    textCaption: 'rgba(15, 23, 42, 0.62)',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    card: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    primary: '#16A34A',
    primaryLight: '#DCFCE7',
    primarySubtle: 'rgba(22, 163, 74, 0.06)',
    primaryBorderSubtle: 'rgba(22, 163, 74, 0.14)',
    primaryDark: '#15803D',
    tint: '#16A34A',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#16A34A',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#3B82F6',
    irrigation: '#2563EB',
    irrigationLight: '#EFF6FF',
    fertilizer: '#16A34A',
    fertilizerLight: '#F0FDF4',
    disease: '#D97706',
    diseaseLight: '#FFFBEB',
  },
};

// ─── Growth Stage Colors ──────────────────────────────────────────
export const STAGE_CONFIG = [
  { index: 0, key: 'tillering', name: 'Tillering', color: '#16A34A', lightBg: '#DCFCE7', summary: 'Plant is spreading secondary green shoots from root crown.' },
  { index: 1, key: 'jointing', name: 'Jointing', color: '#0D9488', lightBg: '#CCFBF1', summary: 'Stem is elongating vertically with visible stem nodes.' },
  { index: 2, key: 'booting', name: 'Booting', color: '#4F46E5', lightBg: '#EEF2FF', summary: 'Head is developing inside the swollen upper leaf sheath.' },
  { index: 3, key: 'anthesis', name: 'Flowering', color: '#D97706', lightBg: '#FEF3C7', summary: 'Delicate yellow anthers are shedding pollen for grain formation.' },
  { index: 4, key: 'grain_filling', name: 'Grain Filling', color: '#EA580C', lightBg: '#FFEDD5', summary: 'Kernel develops from liquid to milky and soft dough.' },
  { index: 5, key: 'maturity', name: 'Maturity', color: '#B45309', lightBg: '#FEF3C7', summary: 'Crops are dry and golden. Ready for combine harvest.' },
] as const;

// ─── Spacing Scale (Strict 4/8-Point Grid System) ─────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
  hero: 64,
} as const;

// ─── Border Radius Tokens (Modern rounded-2xl / rounded-3xl) ──────
export const Radius = {
  sm: 8,     // compact badges, micro-pills
  md: 12,    // input fields, secondary buttons
  lg: 20,    // standard cards (rounded-2xl)
  xl: 24,    // hero cards, modal sheets (rounded-3xl)
  full: 999, // circles, capsule pills
} as const;

// ─── Font Family (Inter via expo-google-fonts) ────────────────────
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

// ─── Typography Scale ─────────────────────────────────────────────
export const Typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: FontFamily.extraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: Colors.light.text,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: Colors.light.text,
  },
  h3: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    lineHeight: 23,
    color: Colors.light.text,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.textSecondary,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.light.text,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSecondary,
  },
  overline: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.light.textMuted,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.text,
  },
};

// ─── Standard Card Style (Soft Tinted Diffused Shadow) ────────────
export const CardStyle: ViewStyle = {
  backgroundColor: Colors.light.card,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: 'rgba(15, 23, 42, 0.06)',
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 16,
  elevation: 2,
};

// ─── Primary CTA Dimension (Tinted Glow + Subtle Inner Highlight) ─
export const PrimaryButtonShadow: ViewStyle = {
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.28)',
  shadowColor: '#16A34A',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.24,
  shadowRadius: 14,
  elevation: 4,
};

// ─── Tabular / Monospace Metric Numbers ───────────────────────────
export const MetricNumberStyle: TextStyle = {
  fontFamily: FontFamily.extraBold,
  fontVariant: ['tabular-nums'],
  letterSpacing: -0.5,
};

// ─── Legacy Fonts (keep for backward compat) ──────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter_400Regular',
    serif: 'serif',
    rounded: 'Inter_400Regular',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "Inter, 'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
