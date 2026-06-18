// ─── CyberSaathi Design Tokens ─────────────────────────────────────────────
// Light theme: crisp, trustworthy, and accessible.

export const colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background:    '#F4F7FA',   // light gray-blue
  surface:       '#FFFFFF',   // white card / sheet surface
  surfaceHigh:   '#F8FAFC',   // elevated surface (inputs, row hover)
  surfaceBorder: '#E2E8F0',   // border / divider

  // ── Brand Accent ─────────────────────────────────────────────────────────
  primary:       '#2563EB',   // standard blue
  primaryDim:    '#1D4ED8',   // muted / pressed state
  primaryGlow:   'rgba(37,99,235,0.1)',

  // ── On-colours ───────────────────────────────────────────────────────────
  onPrimary:         '#FFFFFF',  // light text on bright button
  onSurface:         '#1E293B',  // main body text (dark slate)
  onSurfaceVariant:  '#475569',  // secondary / hint text

  // ── Status ───────────────────────────────────────────────────────────────
  success:    '#059669',   // safe green
  successDim: 'rgba(5,150,105,0.1)',
  warning:    '#D97706',   // caution amber
  warningDim: 'rgba(217,119,6,0.1)',
  error:      '#BA1A1A',   // scam red
  errorDim:   'rgba(186,26,26,0.1)',

  // ── Misc ─────────────────────────────────────────────────────────────────
  shadow: 'rgba(0,0,0,0.06)',
  overlay: 'rgba(0,0,0,0.5)',
};

export const theme = {
  borderRadius:     16,
  cardRadius:       20,
  buttonRadius:     28,
  badgeRadius:      12,
};