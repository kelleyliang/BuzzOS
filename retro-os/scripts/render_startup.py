"""Render an original airy, classic-desktop-style BuzzOS startup sound.

Usage: python3 scripts/render_startup.py /tmp/buzz-startup.wav
"""
import sys
import wave
import numpy as np

RATE = 32000
length = round(3.8 * RATE)
mix = np.zeros((length, 2))
# A soft pad blooms beneath a short bell phrase. This is an original cue,
# with the spacious feel of older desktop startup sounds.
for note, start, gain, pan in [
    (48, 0, 0.055, -0.2), (55, 0.12, 0.045, 0.2),
    (60, 0.28, 0.06, -0.3), (64, 0.45, 0.055, 0.3),
    (67, 0.62, 0.045, -0.1), (74, 0.95, 0.03, 0.15),
]:
    offset = round(start * RATE)
    t = np.arange(length - offset) / RATE
    frequency = 440 * 2 ** ((note - 69) / 12)
    tone = (np.sin(2 * np.pi * frequency * 0.999 * t)
            + np.sin(2 * np.pi * frequency * 1.001 * t)) * 0.5
    tone += 0.08 * np.sin(4 * np.pi * frequency * t) * np.exp(-t)
    ramp = np.clip(t / 0.55, 0, 1)
    sound = tone * ramp * ramp * (3 - 2 * ramp) * np.exp(-t * 0.55) * gain
    mix[offset:, 0] += sound * np.sqrt((1 - pan) / 2)
    mix[offset:, 1] += sound * np.sqrt((1 + pan) / 2)
# Two quiet bell notes provide sparkle without a sharp entrance.
for note, start in [(79, 0.75), (76, 1.35)]:
    offset = round(start * RATE)
    t = np.arange(length - offset) / RATE
    frequency = 440 * 2 ** ((note - 69) / 12)
    bell = (np.sin(2 * np.pi * frequency * t)
            + 0.14 * np.sin(2 * np.pi * frequency * 2.01 * t))
    bell *= (1 - np.exp(-t * 35)) * np.exp(-t * 2.4) * 0.032
    mix[offset:, 0] += bell * 0.7
    mix[offset:, 1] += bell * 0.7
for delay, gain in [(0.09, 0.12), (0.17, 0.08), (0.27, 0.05)]:
    shift = round(delay * RATE)
    mix[shift:] += mix[:-shift, ::-1].copy() * gain
tail = np.linspace(1, 0, round(1.0 * RATE))
tail = tail * tail * (3 - 2 * tail)
mix[-len(tail):] *= tail[:, None]
if not np.isfinite(mix).all():
    raise ValueError('Audio contains invalid samples')
with wave.open(sys.argv[1], 'wb') as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes((mix * 32767).astype('<i2').tobytes())
