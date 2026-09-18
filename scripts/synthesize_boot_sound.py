import math
import os
import random
import struct
import asyncio
import edge_tts
import miniaudio
import lameenc
import wave

SAMPLE_RATE = 44100
DURATION = 10.0 # Exactly 10 seconds as requested by user
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

async def generate_soft_female_voice():
    """Generates the softest, most gentle female voice saying Eltron."""
    out_mp3 = "scratch/voice_soft_female.mp3"
    # Ava Multilingual has an exceptionally gentle, velvety, breathing tone
    comm = edge_tts.Communicate("Eltron", "en-US-AvaMultilingualNeural", rate="-12%", pitch="+0Hz")
    await comm.save(out_mp3)
    return out_mp3

def resample_linear(samples, src_rate, dst_rate):
    ratio = src_rate / dst_rate
    dst_len = int(len(samples) / ratio)
    resampled = [0.0] * dst_len
    for i in range(dst_len):
        src_pos = i * ratio
        idx0 = int(src_pos)
        idx1 = min(idx0 + 1, len(samples) - 1)
        frac = src_pos - idx0
        resampled[i] = (1.0 - frac) * samples[idx0] + frac * samples[idx1]
    return resampled

def create_10s_boot_sound():
    random.seed(1337)
    os.makedirs("scratch", exist_ok=True)
    os.makedirs("public/audio", exist_ok=True)

    # 1. GENERATE ULTRA-SOFT FEMALE VOICE
    print("1. Generating ultra-soft female voice...")
    asyncio.run(generate_soft_female_voice())

    voice_dec = miniaudio.decode_file("scratch/voice_soft_female.mp3")
    v_raw = voice_dec.samples
    v_sr = voice_dec.sample_rate

    # Convert to float [-1.0, 1.0]
    v_float = [s / 32768.0 for s in v_raw]

    # Trim silence
    threshold = max(abs(s) for s in v_float) * 0.04
    start_i = 0
    while start_i < len(v_float) and abs(v_float[start_i]) < threshold:
        start_i += 1
    end_i = len(v_float) - 1
    while end_i > 0 and abs(v_float[end_i]) < threshold:
        end_i -= 1

    # Smooth 30ms fade at edges
    v_trimmed = v_float[max(0, start_i - int(v_sr * 0.04)):min(len(v_float), end_i + int(v_sr * 0.04))]
    fade_len = int(v_sr * 0.03)
    for i in range(fade_len):
        v_trimmed[i] *= (i / fade_len)
        v_trimmed[-1 - i] *= (i / fade_len)

    # Resample to 44.1kHz
    voice_44k = resample_linear(v_trimmed, v_sr, SAMPLE_RATE)
    print(f"Soft female voice ready: {len(voice_44k)/SAMPLE_RATE:.2f}s")

    # 2. SYNTHESIS BUFFERS
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    two_pi = 2.0 * math.pi

    # LAYER A: Cinematic Sub-bass Swell & Warm Ambient Drone (0.0s to 5.2s)
    print("2. Synthesizing cinematic sub-bass & atmospheric ambient drone...")
    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        if t < 5.5:
            # Rise from 0 to 3.5s, then sustain and slowly fade into the sword strike
            if t < 3.0:
                env = (t / 3.0) ** 1.8
            elif t < 4.8:
                env = 1.0
            else:
                env = math.exp(-(t - 4.8) * 3.0)

            # Deep sub 46.25Hz (F#1) + warm octaves
            sub = math.sin(two_pi * 46.25 * t) * 0.45 + math.sin(two_pi * 92.5 * t) * 0.22 + math.sin(two_pi * 138.75 * t) * 0.10
            # Subtle stereo warmth detuning
            sub_l = sub + math.sin(two_pi * 46.4 * t) * 0.08
            sub_r = sub + math.sin(two_pi * 46.1 * t) * 0.08

            left[i] += sub_l * env * 0.38
            right[i] += sub_r * env * 0.38

    # LAYER B: Cinematic Tension Riser & Shimmer Sweep (2.5s to 4.9s)
    print("3. Synthesizing tension riser leading to sword slash...")
    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        if 2.5 <= t <= 4.9:
            progress = (t - 2.5) / (4.9 - 2.5)
            # Exponential pitch sweep 220Hz -> 1800Hz
            sweep_freq = 220.0 * (8.18 ** progress)
            sweep_phase = two_pi * sweep_freq * t
            noise = (random.random() * 2.0 - 1.0) * 0.12
            sig = (math.sin(sweep_phase) * 0.25 + noise) * (progress ** 2.8) * 0.25

            # Pan sweep
            pan_l = 1.0 - 0.4 * progress
            pan_r = 0.6 + 0.4 * progress
            left[i] += sig * pan_l
            right[i] += sig * pan_r

    # LAYER C: THE SWORD LIGHT RAY ("QILICH OVOZIDEK NUR OVOZI" - SHIIII-INGGGG!)
    # Starts at t = 4.85s (when the light beam slices across the logo and brand name)
    print("4. Synthesizing authentic sword slash / blade unsheathe sound effect...")
    t_sword_start = 4.85
    i_sword_start = int(t_sword_start * SAMPLE_RATE)

    # 4.1 Blade Draw / Slicing Friction Whoosh (4.85s to 5.45s)
    whoosh_dur = 0.55
    whoosh_samples = int(whoosh_dur * SAMPLE_RATE)
    for wi in range(whoosh_samples):
        target_i = i_sword_start + wi
        if target_i >= TOTAL_SAMPLES:
            break
        t_w = wi / SAMPLE_RATE
        p_w = t_w / whoosh_dur

        # Envelope: fast curve up, then smooth tail
        env_w = (math.sin(p_w * math.pi) ** 1.6)
        # Swept frequency blade friction (1500Hz -> 7500Hz)
        scrape_freq = 1500.0 + 6000.0 * (p_w ** 0.8)
        # Fluttering steel vibration (38 Hz)
        flutter = 1.0 + 0.3 * math.sin(two_pi * 38.0 * t_w)
        noise = (random.random() * 2.0 - 1.0)
        scrape = (math.sin(two_pi * scrape_freq * t_w) * 0.4 + noise * 0.6) * flutter * env_w * 0.45

        # Pan left-to-right matching the diagonal light ray
        pan_l = math.cos(p_w * math.pi * 0.5)
        pan_r = math.sin(p_w * math.pi * 0.5)
        left[target_i] += scrape * pan_l
        right[target_i] += scrape * pan_r

    # 4.2 Sharp Blade Strike / Edge Clink (t = 5.10s)
    t_strike = 5.10
    i_strike = int(t_strike * SAMPLE_RATE)
    # 15ms sharp impact click
    click_len = int(0.015 * SAMPLE_RATE)
    for ci in range(click_len):
        ti = i_strike + ci
        if ti < TOTAL_SAMPLES:
            c_env = 1.0 - (ci / click_len)
            c_sig = (random.random() * 2.0 - 1.0) * (c_env ** 3.0) * 0.35
            left[ti] += c_sig * 0.9
            right[ti] += c_sig * 1.1

    # 4.3 Resonant Steel Blade Modes ("SHIIII-INGGGG!" ring out from 5.10s to 7.8s)
    blade_modes = [
        # (freq_hz, amplitude, decay_rate, pan)
        (2280.0, 0.48, 1.8, -0.2), # Primary blade fundamental
        (3450.0, 0.42, 2.1,  0.2), # Sharp 3/2 blade harmonic
        (4860.0, 0.38, 2.6, -0.3), # 2nd steel octave
        (6240.0, 0.32, 3.2,  0.3), # Razor edge mode
        (8520.0, 0.25, 3.9, -0.1), # Crystal high sheen
        (11600.0, 0.18, 4.8, 0.4), # Ultra-high diamond sparkle
    ]

    for b_freq, b_amp, b_decay, b_pan in blade_modes:
        pan_l = math.cos((b_pan + 1.0) * math.pi / 4.0)
        pan_r = math.sin((b_pan + 1.0) * math.pi / 4.0)

        for i in range(i_strike, TOTAL_SAMPLES):
            dt = (i - i_strike) / SAMPLE_RATE
            env = math.exp(-b_decay * dt)
            if env < 0.0001:
                break
            # Blade tremor (14Hz mechanical vibration of steel blade)
            tremor = 1.0 + 0.15 * math.sin(two_pi * 14.0 * dt)
            sig = math.sin(two_pi * b_freq * dt) * env * b_amp * tremor
            if dt < 0.002: # avoid click
                sig *= (dt / 0.002)

            left[i] += sig * pan_l
            right[i] += sig * pan_r

    # LAYER D: Luxurious Golden Bell Chime (Harmonizing with sword ring at t = 5.25s)
    gold_chimes = [
        (369.99,  0.28, 1.2), # F#4
        (466.16,  0.26, 1.3), # A#4 (rich gold 3rd)
        (554.37,  0.24, 1.4), # C#5
        (739.99,  0.22, 1.6), # F#5
    ]
    t_chime = 5.25
    i_chime = int(t_chime * SAMPLE_RATE)
    for cf, ca, cd in gold_chimes:
        for i in range(i_chime, TOTAL_SAMPLES):
            dt = (i - i_chime) / SAMPLE_RATE
            env = math.exp(-cd * dt)
            if env < 0.0001:
                break
            sig = (math.sin(two_pi * cf * dt) * 0.7 + math.sin(two_pi * cf * 2.0 * dt) * 0.3) * env * ca
            if dt < 0.003:
                sig *= (dt / 0.003)
            left[i] += sig * 0.5
            right[i] += sig * 0.5

    # LAYER E: ULTRA-SOFT FEMALE VOICE "ELTRON" (Starts at t = 6.80s)
    # Speaks right as the sword blade ring softens into lush gold reverb
    print("5. Mixing ultra-soft female voice 'Eltron'...")
    t_voice = 6.80
    i_voice = int(t_voice * SAMPLE_RATE)
    voice_gain = 0.95

    for vi, val in enumerate(voice_44k):
        target_i = i_voice + vi
        if target_i >= TOTAL_SAMPLES:
            break
        v_sample = val * voice_gain
        left[target_i] += v_sample * 0.98
        right[target_i] += v_sample * 1.02

    # LAYER F: Golden Shimmer Spatial Reverb Matrix
    print("6. Applying lush spatial reverb...")
    delays_ms = [37, 53, 73, 97, 139, 181]
    feedbacks = [0.42, 0.38, 0.34, 0.30, 0.25, 0.20]

    rev_l = [0.0] * TOTAL_SAMPLES
    rev_r = [0.0] * TOTAL_SAMPLES

    for d_ms, fb in zip(delays_ms, feedbacks):
        d_samples_l = int(SAMPLE_RATE * (d_ms / 1000.0))
        d_samples_r = int(SAMPLE_RATE * ((d_ms * 1.09) / 1000.0))

        for i in range(d_samples_l, TOTAL_SAMPLES):
            rev_l[i] += (left[i - d_samples_l] + rev_l[i - d_samples_l] * fb) * 0.16

        for i in range(d_samples_r, TOTAL_SAMPLES):
            rev_r[i] += (right[i - d_samples_r] + rev_r[i - d_samples_r] * fb) * 0.16

    reverb_wet = 0.38
    for i in range(TOTAL_SAMPLES):
        left[i] += rev_l[i] * reverb_wet
        right[i] += rev_r[i] * reverb_wet

    # LAYER G: Smooth Master Fade-Out (9.1s to 9.95s)
    t_fade_start = 9.1
    t_fade_end = 9.95
    i_fade_start = int(t_fade_start * SAMPLE_RATE)
    i_fade_end = int(t_fade_end * SAMPLE_RATE)

    for i in range(i_fade_start, TOTAL_SAMPLES):
        if i >= i_fade_end:
            left[i] = 0.0
            right[i] = 0.0
        else:
            fade = 0.5 * (1.0 + math.cos(math.pi * (i - i_fade_start) / (i_fade_end - i_fade_start)))
            left[i] *= fade
            right[i] *= fade

    # LAYER H: Mastering Limiter & Soft Analog Saturation
    print("7. Mastering 10-second audio...")
    peak = max(max(abs(l) for l in left), max(abs(r) for r in right))
    print(f"Pre-master peak: {peak:.3f}")
    gain = 0.90 / (peak if peak > 0 else 1.0)

    pcm_bytes = bytearray()
    for i in range(TOTAL_SAMPLES):
        sl = math.tanh(left[i] * gain)
        sr = math.tanh(right[i] * gain)

        il = int(max(-32767, min(32767, sl * 32767.0)))
        ir = int(max(-32767, min(32767, sr * 32767.0)))
        pcm_bytes.extend(struct.pack('<hh', il, ir))

    # Save WAV
    wav_path = "public/audio/eltron-boot.wav"
    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_bytes)
    print(f"Saved WAV: {wav_path} ({os.path.getsize(wav_path)} bytes)")

    # Save MP3 (192 kbps studio quality)
    mp3_path = "public/audio/eltron-boot.mp3"
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(192)
    encoder.set_in_sample_rate(SAMPLE_RATE)
    encoder.set_channels(2)
    encoder.set_quality(2)

    mp3_data = encoder.encode(bytes(pcm_bytes)) + encoder.flush()
    with open(mp3_path, "wb") as f:
        f.write(mp3_data)
    print(f"Saved MP3: {mp3_path} ({os.path.getsize(mp3_path)} bytes)")

if __name__ == "__main__":
    create_10s_boot_sound()
