import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/app-context';
import { FontFamily, Radius, Spacing, Colors } from '@/constants/theme';

/**
 * Inline accessibility controls — designed to sit INSIDE a screen header row,
 * not as a standalone full-width band. This saves ~40px of vertical space.
 */
export function AccessibilityControls() {
  const { language, toggleLanguage, fontScale, toggleFontScale } = useApp();

  return (
    <View style={styles.inlineRow}>
      {/* Language Switcher */}
      <TouchableOpacity
        onPress={toggleLanguage}
        style={[styles.pill, language === 'ur' && styles.pillActive]}
        activeOpacity={0.8}>
        <Ionicons
          name="globe-outline"
          size={13}
          color={language === 'ur' ? '#FFFFFF' : Colors.light.primaryDark}
          style={{ marginRight: 3 }}
        />
        <Text style={[styles.pillText, language === 'ur' && styles.pillTextActive]}>
          {language === 'en' ? 'اردو' : 'EN'}
        </Text>
      </TouchableOpacity>

      {/* Font Scale Switcher */}
      <TouchableOpacity
        onPress={toggleFontScale}
        style={[styles.pill, fontScale === 'large' && styles.pillActive]}
        activeOpacity={0.8}>
        <Text style={[styles.pillText, fontScale === 'large' && styles.pillTextActive]}>
          {fontScale === 'large' ? 'A' : 'A+'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Floating audio mini-player — sits just above the tab bar when audio is playing.
 * Much less intrusive than a top banner.
 */
export function AudioMiniPlayer() {
  const { playingAudioId, stopAudio, t } = useApp();

  if (!playingAudioId) return null;

  return (
    <View style={styles.floatingPlayer}>
      <View style={styles.playerPulse}>
        <Ionicons name="volume-high" size={14} color="#FFFFFF" />
      </View>
      <Text style={styles.playerText} numberOfLines={1}>
        {t.playingAudio}
      </Text>
      <TouchableOpacity onPress={stopAudio} style={styles.playerStop}>
        <Ionicons name="stop-circle" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

/**
 * Legacy full-width bar for backward compatibility during transition.
 * Screens being redesigned should use AccessibilityControls inline instead.
 */
export function AccessibilityBar() {
  const { language, toggleLanguage, fontScale, toggleFontScale, playingAudioId, stopAudio, t } = useApp();

  return (
    <View style={styles.legacyContainer}>
      {/* Audio Playback Active Notification */}
      {playingAudioId && (
        <View style={styles.audioPlayerStrip}>
          <View style={styles.audioIconWrapper}>
            <Ionicons name="volume-high" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.audioPlayerText} numberOfLines={1}>
            {t.playingAudio}
          </Text>
          <TouchableOpacity onPress={stopAudio} style={styles.stopButton}>
            <Ionicons name="stop-circle" size={18} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>{t.stop}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Language & Font Controls */}
      <View style={styles.controlsRow}>
        {/* Language Switcher */}
        <TouchableOpacity
          onPress={toggleLanguage}
          style={[styles.pill, language === 'ur' && styles.pillActive]}
          activeOpacity={0.8}>
          <Ionicons
            name="globe-outline"
            size={14}
            color={language === 'ur' ? '#FFFFFF' : '#15803D'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.pillText, language === 'ur' && styles.pillTextActive]}>
            {language === 'en' ? 'اردو (Urdu)' : 'English'}
          </Text>
        </TouchableOpacity>

        {/* Font Scale Switcher */}
        <TouchableOpacity
          onPress={toggleFontScale}
          style={[styles.pill, fontScale === 'large' && styles.pillActive]}
          activeOpacity={0.8}>
          <Text style={[styles.pillText, fontScale === 'large' && styles.pillTextActive]}>
            {fontScale === 'large' ? 'A (Normal)' : 'A+ (Bada Text)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Inline variant (new) ─────────────────
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pillActive: {
    backgroundColor: Colors.light.primaryDark,
    borderColor: Colors.light.primaryDark,
  },
  pillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#334155',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  // ─── Floating audio player (new) ──────────
  floatingPlayer: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 128, 61, 0.95)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  playerPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerText: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  playerStop: {
    padding: 4,
  },

  // ─── Legacy full-width bar ────────────────
  legacyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  audioPlayerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    gap: 8,
  },
  audioIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
