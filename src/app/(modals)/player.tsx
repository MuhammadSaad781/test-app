import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeTouchEvent,
} from "react-native";
import { GlassCard, GlassButton } from "../../components/ui/GlassCard";
import { useMusicStore } from "../../stores/musicStore";
import { THEME } from "../../constants/theme";

export default function PlayerModal() {
  // Get state and actions directly from Zustand store
  const currentTrack = useMusicStore((state) => state.currentTrack);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const currentPosition = useMusicStore((state) => state.currentPosition);
  const duration = useMusicStore((state) => state.duration);
  const loading = useMusicStore((state) => state.loading);
  const error = useMusicStore((state) => state.error);
  const pause = useMusicStore((state) => state.pause);
  const resume = useMusicStore((state) => state.resume);
  const seekTo = useMusicStore((state) => state.seekTo);

  const [progressWidth, setProgressWidth] = useState(0);

  // Show error alert when error changes
  useEffect(() => {
    if (error) {
      Alert.alert("Playback Error", error);
    }
  }, [error]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => (duration ? (currentPosition / duration) * 100 : 0);

  const handleSeek = (percentage: number) => {
    if (duration) {
      const newPosition = (percentage / 100) * duration;
      console.log('Seeking to percentage:', percentage, 'position:', newPosition);
      seekTo(newPosition);
    }
  };

  const handleSeekForward = () => {
    const newPosition = Math.min(duration, currentPosition + 10);
    console.log('Seeking forward to:', newPosition);
    seekTo(newPosition);
  };

  const handleSeekBackward = () => {
    const newPosition = Math.max(0, currentPosition - 10);
    console.log('Seeking backward to:', newPosition);
    seekTo(newPosition);
  };

  const handlePlayPause = () => {
    console.log("Play/Pause clicked. Currently playing:", isPlaying);
    if (isPlaying) {
      pause();
    } else if (currentTrack) {
      resume();
    }
  };

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <GlassCard style={styles.noTrackCard}>
          <Text style={styles.noTrackText}>No track selected</Text>
          <Text style={styles.noTrackSubtext}>
            Go back and select a challenge to start playing music
          </Text>
        </GlassCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Track Info */}
        <GlassCard style={styles.trackInfoCard}>
          <Text style={styles.trackTitle}>{currentTrack.title}</Text>
          <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
          <Text style={styles.trackDescription}>
            {currentTrack.description}
          </Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsLabel}>Challenge Points</Text>
            <Text style={styles.pointsValue}>{currentTrack.points}</Text>
          </View>
        </GlassCard>

        {/* Progress Section */}
        <GlassCard style={styles.progressCard}>
          <Text style={styles.progressLabel}>Listening Progress</Text>
          <TouchableOpacity
            style={styles.progressTrack}
            onPress={(event: NativeSyntheticEvent<NativeTouchEvent>) => {
              const { locationX } = event.nativeEvent;
              const percentage = progressWidth
                ? (locationX / progressWidth) * 100
                : 0;
              handleSeek(percentage);
            }}
          >
            <View
              style={styles.progressBackground}
              onLayout={(event: LayoutChangeEvent) =>
                setProgressWidth(event.nativeEvent.layout.width)
              }
            >
              <View
                style={[styles.progressFill, { width: `${getProgress()}%` }]}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(getProgress())}% Complete
          </Text>
        </GlassCard>

        {/* Controls */}
        <GlassCard style={styles.controlsCard}>
          <View style={styles.controlsRow}>
            {/* removed -10s and +10s buttons for better UI */}
            <GlassButton
              title="⏪"
              onPress={handleSeekBackward}
              variant="secondary"
              style={styles.controlButton}
            />
            <GlassButton
              title={loading ? "..." : isPlaying ? "⏸️ Pause" : "▶️ Play"}
              onPress={handlePlayPause}
              variant="primary"
              style={styles.mainControlButton}
              loading={loading}
            />
            <GlassButton
              title="⏩"
              onPress={handleSeekForward}
              variant="secondary"
              style={styles.controlButton}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </GlassCard>

        {/* Challenge Progress */}
        <GlassCard style={styles.challengeCard}>
          <Text style={styles.challengeLabel}>Challenge Status</Text>
          <View style={styles.challengeInfo}>
            <Text
              style={[
                styles.challengeStatus,
                {
                  color: currentTrack.completed
                    ? THEME.colors.secondary
                    : THEME.colors.accent,
                },
              ]}
            >
              {currentTrack.completed ? "✅ Completed" : "🎧 In Progress"}
            </Text>
            <Text style={styles.challengeProgress}>
              {Math.round(getProgress())}%  of challenge complete
              {/* {Math.round(currentTrack.progress)}% of challenge complete */}
            </Text>
          </View>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  content: {
    flex: 1,
    padding: THEME.spacing.lg,
    justifyContent: "space-between",
  },
  noTrackCard: { margin: THEME.spacing.xl, alignItems: "center" },
  noTrackText: {
    fontSize: THEME.fonts.sizes.xl,
    fontWeight: "bold",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
  },
  noTrackSubtext: {
    fontSize: THEME.fonts.sizes.md,
    color: THEME.colors.text.secondary,
    textAlign: "center",
  },
  trackInfoCard: { alignItems: "center" },
  trackTitle: {
    fontSize: THEME.fonts.sizes.xxl,
    fontWeight: "bold",
    color: THEME.colors.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.xs,
  },
  trackArtist: {
    fontSize: THEME.fonts.sizes.lg,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
  },
  trackDescription: {
    fontSize: THEME.fonts.sizes.sm,
    color: THEME.colors.text.tertiary,
    textAlign: "center",
    marginBottom: THEME.spacing.lg,
  },
  pointsContainer: { alignItems: "center" },
  pointsLabel: {
    fontSize: THEME.fonts.sizes.sm,
    color: THEME.colors.text.secondary,
  },
  pointsValue: {
    fontSize: THEME.fonts.sizes.xl,
    fontWeight: "bold",
    color: THEME.colors.accent,
  },
  progressCard: {},
  progressLabel: {
    fontSize: THEME.fonts.sizes.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.md,
  },
  progressTrack: { marginBottom: THEME.spacing.md },
  progressBackground: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: THEME.colors.accent,
    borderRadius: 4,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.sm,
  },
  timeText: {
    fontSize: THEME.fonts.sizes.sm,
    color: THEME.colors.text.secondary,
  },
  progressPercentage: {
    fontSize: THEME.fonts.sizes.lg,
    fontWeight: "bold",
    color: THEME.colors.accent,
    textAlign: "center",
  },
  controlsCard: {},
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: { flex: 0.25, marginHorizontal: THEME.spacing.xs },
  mainControlButton: { flex: 0.4, marginHorizontal: THEME.spacing.xs },
  errorText: {
    color: "#FF6B6B",
    fontSize: THEME.fonts.sizes.sm,
    textAlign: "center",
    marginTop: THEME.spacing.md,
  },
  challengeCard: {},
  challengeLabel: {
    fontSize: THEME.fonts.sizes.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.md,
  },
  challengeInfo: { alignItems: "center" },
  challengeStatus: {
    fontSize: THEME.fonts.sizes.lg,
    fontWeight: "bold",
    marginBottom: THEME.spacing.xs,
  },
  challengeProgress: {
    fontSize: THEME.fonts.sizes.sm,
    color: THEME.colors.text.secondary,
  },
});