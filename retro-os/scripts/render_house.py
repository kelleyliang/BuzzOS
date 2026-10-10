"""Render BuzzOS's original mellow 32-bar jazz-house loop (requires NumPy).

Usage: python3 scripts/render_house.py /tmp/buzz-after-hours.wav
The tune is synthesized from scratch; it uses no recordings or samples.
"""
import sys
import wave
import numpy as np

RATE = 32000
BPM = 108
BEAT = 60 / BPM
BARS = 32
LENGTH = round(BARS * 4 * BEAT * RATE)
rng = np.random.default_rng(118)
music = np.zeros((LENGTH, 2))
drums = np.zeros_like(music)


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


def timeline(duration):
    return np.arange(round(duration * RATE)) / RATE


def add(bus, sound, beat, gain=1, pan=0):
    # Wrapping the release and delay tails keeps the loop boundary continuous.
    indices = (np.arange(len(sound)) + round(beat * BEAT * RATE)) % LENGTH
    bus[indices, 0] += sound * gain * np.sqrt((1 - pan) / 2)
    bus[indices, 1] += sound * gain * np.sqrt((1 + pan) / 2)


def keys(note, attack=220, fade_in=0):
    t = timeline(2.8)
    frequency = hz(note)
    # A quiet felt-piano approximation: softly struck, slightly detuned strings,
    # with upper harmonics dying away sooner than the fundamental.
    tone = np.zeros_like(t)
    for harmonic, amplitude in enumerate([1, 0.32, 0.14, 0.06, 0.025, 0.01], start=1):
        partial = frequency * harmonic * np.sqrt(1 + 0.000025 * harmonic ** 2)
        strings = (np.sin(2 * np.pi * partial * 0.9996 * t)
                   + np.sin(2 * np.pi * partial * 1.0004 * t)) * 0.5
        tone += amplitude * strings * np.exp(np.clip(-t * (1.5 + harmonic * 0.65), -500, 0))
    envelope = 1 - np.exp(np.clip(-t * attack, -500, 0))
    if fade_in:
        # Smoothstep starts with zero slope, avoiding a sudden chord entrance.
        ramp = np.clip(t / fade_in, 0, 1)
        envelope *= ramp * ramp * (3 - 2 * ramp)
    return tone * envelope


def bass(note):
    t = timeline(0.65)
    frequency = hz(note)
    tone = (np.sin(2 * np.pi * frequency * t) + 0.18 * np.sin(4 * np.pi * frequency * t)
            + 0.06 * np.sin(6 * np.pi * frequency * t))
    return tone * (1 - np.exp(-t * 90)) * np.exp(-t * 5)


def lead(note):
    return keys(note)


def kick():
    t = timeline(0.42)
    phase = 2 * np.pi * (48 * t + 35 * (1 - np.exp(-t * 45)) / 45)
    return np.sin(phase) * (1 - np.exp(-t * 250)) * np.exp(-t * 14)


def hat(open_hat=False):
    t = timeline(0.23 if open_hat else 0.08)
    noise = rng.normal(0, 1, len(t))
    soft = np.convolve(noise, np.ones(4) / 4, mode='same')
    return soft * (1 - np.exp(-t * 140)) * np.exp(-t * (30 if open_hat else 55)) * 0.07


def snare():
    t = timeline(0.18)
    noise = rng.normal(0, 1, len(t))
    brush = np.convolve(noise, np.ones(6) / 6, mode='same')
    return brush * (1 - np.exp(-t * 90)) * np.exp(-t * 24) * 0.12


# Extended voicings: Am9, D9, Gmaj9, Cmaj9, Fmaj9, B half-diminished,
# E7(b9), Am9. Each pass varies the melody and rhythmic accents.
CHORDS = [
    (33, [60, 64, 67, 71]), (38, [60, 64, 66, 69]),
    (31, [59, 62, 66, 69]), (36, [59, 62, 64, 67]),
    (29, [57, 60, 64, 67]), (35, [57, 62, 65, 69]),
    (28, [56, 62, 65, 71]), (33, [60, 64, 67, 71]),
]
MELODIES = [[76, 79, 83], [78, 76, 74], [74, 78, 81], [76, 74, 71],
            [76, 79, 81], [77, 74, 71], [77, 74, 68], [71, 76, 79]]

for bar in range(BARS):
    start = bar * 4
    root, chord = CHORDS[bar % 8]
    for beat in range(4):
        add(drums, kick(), start + beat, 0.35)
        add(drums, hat(True), start + beat + 0.56 + rng.uniform(-0.012, 0.012), 0.45, 0.2)
        if beat % 2:
            add(drums, snare(), start + beat + rng.uniform(-0.01, 0.015), 0.7, -0.08)
    if bar % 4 == 3:
        add(drums, hat(), start + 3.82, 0.3, -0.3)
    for offset, note in [(0, root), (1.65, root + 7), (2.55, root), (3.6, root + 12)]:
        add(music, bass(note), start + offset, 0.23)
    rhythm = [[(0.15, 0.14), (2.6, 0.1)], [(0.55, 0.12), (2.3, 0.14)],
              [(0.25, 0.13), (1.8, 0.07), (3.4, 0.1)], [(0, 0.13), (2.75, 0.09)]][bar % 4]
    for offset, gain in rhythm:
        for voice, note in enumerate(chord):
            # Backing chords swell gently and sit well below the melody.
            add(music, keys(note, attack=8, fade_in=0.45), start + offset + voice * 0.065 + rng.uniform(-0.008, 0.008),
                gain * 0.15 * rng.uniform(0.9, 1.05), (voice - 1.5) * 0.2)
    if bar % 4 in [1, 3] and not 16 <= bar < 24:
        melody = MELODIES[bar % 8]
        if bar >= 24:
            melody = list(reversed(melody))
        for offset, note in zip([1.3, 2.65, 3.3], melody):
            sound = lead(note)
            add(music, sound, start + offset, 0.07, -0.15)

# Short, quiet room reflections replace the electronic pumping and long delay.
mix = music + drums
for delay, gain in [(0.037, 0.1), (0.061, 0.07), (0.097, 0.04)]:
    mix += np.roll(music[:, ::-1], round(delay * RATE), axis=0) * gain
mix -= mix.mean(axis=0)
mix = np.tanh(mix * 0.85)
if not np.isfinite(mix).all():
    raise ValueError('Audio contains invalid samples')
mix *= 0.65 / np.max(np.abs(mix))
pcm = (mix * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(RATE)
    output.writeframes(pcm.tobytes())
print(f'Rendered original loop: {LENGTH / RATE:.2f}s, {BPM} BPM, {BARS} bars')
