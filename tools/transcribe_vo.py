import json
import sys
from faster_whisper import WhisperModel

audio = sys.argv[1]
out = sys.argv[2]

model = WhisperModel("base.en", device="cpu", compute_type="int8")
segments, info = model.transcribe(audio, word_timestamps=True, vad_filter=False)

data = []
for seg in segments:
    data.append({
        "start": round(seg.start, 2),
        "end": round(seg.end, 2),
        "text": seg.text.strip(),
    })
    print(f"[{seg.start:7.2f} - {seg.end:7.2f}]  {seg.text.strip()}")

with open(out, "w", encoding="utf-8") as f:
    json.dump({"duration": info.duration, "segments": data}, f, indent=2)

print(f"\nTOTAL AUDIO DURATION: {info.duration:.2f}s  |  segments: {len(data)}")
