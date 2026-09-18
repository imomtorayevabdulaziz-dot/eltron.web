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
DURATION = 5.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

async def generate_voice():
    out_mp3 = 'scratch/voice_madina.mp3'
    comm = edge_tts.Communicate('Eltron', 'uz-UZ-MadinaNeural', rate='-6%', pitch='+0Hz')
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

def create_boot_sound():
    random.seed(42)
    os.makedirs('scratch', exist_ok=True)
    os.makedirs('public/audio', exist_ok=True)
    
    print('Generating voice with edge-tts...')
    asyncio.run(generate_voice())
    
    voice_dec = miniaudio.decode_file('scratch/voice_madina.mp3')
    v_raw = voice_dec.samples
    v_sr = voice_dec.sample_rate
    
    v_float = [s / 32768.0 for s in v_raw]
    
    threshold = max(abs(s) for s in v_float) * 0.04
    start_i = 0
    while start_i < len(v_float) and abs(v_float[start_i]) < threshold:
        start_i += 1
    end_i = len(v_float) - 1
    while end_i > 0 and abs(v_float[end_i]) < threshold:
        end_i -= 1
    
    v_trimmed = v_float[max(0, start_i - int(v_sr * 0.05)):min(len(v_float), end_i + int(v_sr * 0.05))]
    fade_len = int(v_sr * 0.02)
    for i in range(fade_len):
        v_trimmed[i] *= (i / fade_len)
        v_trimmed[-1 - i] *= (i / fade_len)
        
    voice_44k = resample_linear(v_trimmed, v_sr, SAMPLE_RATE)
    print(f'Voice ready: {len(voice_44k)/SAMPLE_RATE:.2f}s at 44.1kHz')
    
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    two_pi = 2.0 * math.pi
    
    print('Synthesizing cinematic sub-bass & atmospheric sweep...')
    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        if t < 2.5:
            if t < 1.4:
                env = (t / 1.4) ** 2.0
            else:
                env = math.exp(-(t - 1.4) * 2.0)
                
            sub = math.sin(two_pi * 46.25 * t) * 0.45 + math.sin(two_pi * 92.5 * t) * 0.25
            sub_l = sub + math.sin(two_pi * 46.4 * t) * 0.1
            sub_r = sub + math.sin(two_pi * 46.1 * t) * 0.1
            
            left[i] += sub_l * env * 0.4
            right[i] += sub_r * env * 0.4
            
    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        if 0.7 <= t <= 1.85:
            progress = (t - 0.7) / (1.85 - 0.7)
            sweep_freq = 300.0 * (8.0 ** progress)
            sweep_phase = two_pi * sweep_freq * t
            noise = (random.random() * 2.0 - 1.0) * 0.15
            sig = (math.sin(sweep_phase) * 0.3 + noise) * (progress ** 2.5) * 0.25
            
            pan_l = 1.0 - 0.5 * progress
            pan_r = 0.5 + 0.5 * progress
            left[i] += sig * pan_l
            right[i] += sig * pan_r
            
    print('Synthesizing crystal bell chord...')
    chime_notes = [
        (185.00,  0.0, 0.40, 0.75, 2.76),
        (277.18, -0.2, 0.35, 0.85, 2.76),
        (369.99,  0.2, 0.32, 0.95, 2.75),
        (415.30, -0.3, 0.28, 1.10, 3.00),
        (466.16,  0.3, 0.28, 1.15, 2.76),
        (554.37, -0.4, 0.24, 1.30, 2.76),
        (739.99,  0.4, 0.22, 1.45, 2.76),
        (1108.7,  0.1, 0.12, 1.80, 2.76),
    ]
    
    t_chime = 1.80
    i_chime = int(t_chime * SAMPLE_RATE)
    
    for note_freq, pan, amp, decay_rate, bell_mult in chime_notes:
        pan_l = math.cos((pan + 1.0) * math.pi / 4.0)
        pan_r = math.sin((pan + 1.0) * math.pi / 4.0)
        
        for i in range(i_chime, TOTAL_SAMPLES):
            dt = (i - i_chime) / SAMPLE_RATE
            env = math.exp(-decay_rate * dt)
            if env < 0.0001:
                break
                
            f = note_freq
            sig = (
                math.sin(two_pi * f * dt) * 0.65 +
                math.sin(two_pi * f * 2.0 * dt) * 0.20 * math.exp(-decay_rate * 1.5 * dt) +
                math.sin(two_pi * f * bell_mult * dt) * 0.15 * math.exp(-decay_rate * 2.2 * dt)
            )
            if dt < 0.003:
                sig *= (dt / 0.003)
                
            left[i] += sig * env * amp * pan_l
            right[i] += sig * env * amp * pan_r
            
    print('Mixing gentle female voice Eltron...')
    t_voice = 2.75
    i_voice = int(t_voice * SAMPLE_RATE)
    voice_gain = 0.85
    
    for vi, val in enumerate(voice_44k):
        target_i = i_voice + vi
        if target_i >= TOTAL_SAMPLES:
            break
        v_sample = val * voice_gain
        left[target_i] += v_sample * 0.98
        right[target_i] += v_sample * 1.02

    print('Applying golden shimmer reverb...')
    delays_ms = [31, 47, 67, 89, 127, 163]
    feedbacks = [0.45, 0.40, 0.35, 0.30, 0.25, 0.20]
    
    rev_l = [0.0] * TOTAL_SAMPLES
    rev_r = [0.0] * TOTAL_SAMPLES
    
    for d_ms, fb in zip(delays_ms, feedbacks):
        d_samples_l = int(SAMPLE_RATE * (d_ms / 1000.0))
        d_samples_r = int(SAMPLE_RATE * ((d_ms * 1.08) / 1000.0))
        
        for i in range(d_samples_l, TOTAL_SAMPLES):
            rev_l[i] += (left[i - d_samples_l] + rev_l[i - d_samples_l] * fb) * 0.18
            
        for i in range(d_samples_r, TOTAL_SAMPLES):
            rev_r[i] += (right[i - d_samples_r] + rev_r[i - d_samples_r] * fb) * 0.18

    reverb_wet = 0.35
    for i in range(TOTAL_SAMPLES):
        left[i] += rev_l[i] * reverb_wet
        right[i] += rev_r[i] * reverb_wet

    t_fade_start = 4.2
    t_fade_end = 4.95
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

    print('Mastering & soft clipping limiter...')
    peak = max(max(abs(l) for l in left), max(abs(r) for r in right))
    print(f'Pre-master peak: {peak:.3f}')
    
    gain = 0.90 / (peak if peak > 0 else 1.0)
    
    pcm_bytes = bytearray()
    for i in range(TOTAL_SAMPLES):
        sl = math.tanh(left[i] * gain)
        sr = math.tanh(right[i] * gain)
        
        il = int(max(-32767, min(32767, sl * 32767.0)))
        ir = int(max(-32767, min(32767, sr * 32767.0)))
        
        pcm_bytes.extend(struct.pack('<hh', il, ir))

    wav_path = 'public/audio/eltron-boot.wav'
    with wave.open(wav_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm_bytes)
    print(f'Saved WAV: {wav_path} ({os.path.getsize(wav_path)} bytes)')

    mp3_path = 'public/audio/eltron-boot.mp3'
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(192)
    encoder.set_in_sample_rate(SAMPLE_RATE)
    encoder.set_channels(2)
    encoder.set_quality(2)
    
    mp3_data = encoder.encode(bytes(pcm_bytes))
    mp3_data += encoder.flush()
    
    with open(mp3_path, 'wb') as f:
        f.write(mp3_data)
    print(f'Saved MP3: {mp3_path} ({os.path.getsize(mp3_path)} bytes)')

if __name__ == '__main__':
    create_boot_sound()
