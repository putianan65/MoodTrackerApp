import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useRef } from 'react';
import { GestureResponderEvent, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { CLIP_DURATION, eyeMidpoint, timeForAngle } from './gazeFrames';

const clip = require('../../../assets/video/mascot.mp4');

/** How long the character keeps looking at the last touch before looping again. */
const RESUME_AFTER_MS = 2400;
const MIN_SEEK_INTERVAL_MS = 40;

export type MascotGaze = {
  player: ReturnType<typeof useVideoPlayer>;
  videoRef: React.RefObject<View | null>;
  /** Re-measure the video's on-screen box (call after layout and on scroll). */
  measure: () => void;
  /** Raw touch handlers for the screen root; they observe without claiming touches. */
  touchHandlers: {
    onTouchStart: (e: GestureResponderEvent) => void;
    onTouchMove: (e: GestureResponderEvent) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
  };
  /** Latest gaze direction in radians and whether a touch is steering it (0..1). */
  angle: SharedValue<number>;
  engaged: SharedValue<number>;
};

/**
 * Touch-driven video scrubbing: a touch anywhere on screen selects the frame in
 * which the mascot's recorded pupils point at the finger. Seeks are coalesced
 * through requestAnimationFrame and only the newest target is kept.
 *
 * `loop` (phones): the clip plays muted on loop and resumes shortly after the
 * finger lifts. `scrub` (wide screens): starts paused at 0 and holds the last
 * selected frame, like the desktop pointer behaviour.
 */
export function useMascotGaze({ mode, reduceMotion }: { mode: 'loop' | 'scrub'; reduceMotion: boolean }): MascotGaze {
  const player = useVideoPlayer(clip, (p) => {
    p.muted = true;
    p.loop = true;
  });

  const videoRef = useRef<View>(null);
  const rect = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const target = useRef<number | null>(null);
  const frame = useRef(0);
  const lastSeekAt = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const angle = useSharedValue(Math.PI / 2);
  const engaged = useSharedValue(0);

  const shouldLoop = mode === 'loop' && !reduceMotion;

  // Switch playback when the breakpoint or the reduced-motion setting changes.
  useEffect(() => {
    player.loop = shouldLoop;
    if (shouldLoop) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, shouldLoop]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const measure = useCallback(() => {
    videoRef.current?.measureInWindow((x, y, width, height) => {
      rect.current = { x, y, width, height };
    });
  }, []);

  const seek = useCallback(() => {
    frame.current = 0;
    const desired = target.current;
    if (desired == null) return;
    if (Date.now() - lastSeekAt.current < MIN_SEEK_INTERVAL_MS) {
      frame.current = requestAnimationFrame(seek);
      return;
    }
    const duration = player.duration > 0 ? player.duration : CLIP_DURATION;
    if (Math.abs(player.currentTime - desired) > 1 / 48) {
      player.currentTime = Math.min(desired, duration - 1 / 24);
      lastSeekAt.current = Date.now();
    }
  }, [player]);

  const lookAt = useCallback(
    (pageX: number, pageY: number) => {
      const { x, y, width, height } = rect.current;
      if (!width || !height) return;
      const eye = eyeMidpoint(width, height);
      const dx = pageX - (x + eye.x);
      const dy = pageY - (y + eye.y);
      // Ignore the unstable centre between the eyes.
      if (Math.hypot(dx, dy) <= 8) return;
      const a = Math.atan2(dy, dx);
      angle.value = a;
      engaged.value = withTiming(1, { duration: 180 });
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      if (player.playing) player.pause();
      target.current = timeForAngle(a);
      if (!frame.current) frame.current = requestAnimationFrame(seek);
    },
    [angle, engaged, player, seek],
  );

  const release = useCallback(() => {
    engaged.value = withTiming(0, { duration: 600 });
    if (!shouldLoop) return;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      target.current = null;
      player.play();
    }, RESUME_AFTER_MS);
  }, [engaged, player, shouldLoop]);

  const onTouch = useCallback(
    (e: GestureResponderEvent) => lookAt(e.nativeEvent.pageX, e.nativeEvent.pageY),
    [lookAt],
  );

  // Web (browser or an in-editor device preview): follow the mouse pointer too.
  // A mouse never "lifts", so treat a short pause in movement as a release.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let idle: ReturnType<typeof setTimeout> | null = null;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      measure();
      lookAt(e.clientX, e.clientY);
      if (idle) clearTimeout(idle);
      idle = setTimeout(release, 1200);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', measure, { passive: true, capture: true });
    window.addEventListener('resize', measure);
    return () => {
      if (idle) clearTimeout(idle);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
    };
  }, [lookAt, measure, release]);

  return {
    player,
    videoRef,
    measure,
    touchHandlers: {
      onTouchStart: onTouch,
      onTouchMove: onTouch,
      onTouchEnd: release,
      onTouchCancel: release,
    },
    angle,
    engaged,
  };
}

type ViewProps = {
  gaze: MascotGaze;
  style?: StyleProp<ViewStyle>;
};

/** The mascot clip, drawn with object-fit: cover. Decorative, never interactive. */
export function MascotVideo({ gaze, style }: ViewProps) {
  return (
    <View
      ref={gaze.videoRef}
      onLayout={gaze.measure}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={style}
    >
      <VideoView
        player={gaze.player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        surfaceType="textureView"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Explicit size (not just insets) so the web <video> element fills its box too.
  video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});
