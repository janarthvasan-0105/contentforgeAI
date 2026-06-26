import subprocess
import os

LANGUAGE_CONFIG = {
    "english": {
        "font": "fonts/NotoSans-Bold.ttf",
        "headline": "Your Family Deserves the Right Home.",
        "subtext": "Browse verified listings on RentIt",
        "cta": "Download Free Today"
    },
    "tamil": {
        "font": "fonts/NotoSansTamil-Bold.ttf",
        "headline": "உங்கள் குடும்பம் சரியான வீட்டிற்கு தகுதியானது",
        "subtext": "RentIt-ல் சரிபார்க்கப்பட்ட சொத்துக்களை உலாவுங்கள்",
        "cta": "இன்றே இலவசமாக பதிவிறக்குங்கள்"
    },
    "malayalam": {
        "font": "fonts/NotoSansMalayalam-Bold.ttf",
        "headline": "നിങ്ങളുടെ കുടുംബം ശരിയായ വീടിന് അർഹമാണ്",
        "subtext": "RentIt-ൽ പരിശോധിച്ച ലിസ്റ്റിംഗുകൾ ബ്രൗസ് ചെയ്യുക",
        "cta": "ഇന്ന് സൗജന്യമായി ഡൗൺലോഡ് ചെയ്യുക"
    },
    "telugu": {
        "font": "fonts/NotoSansTelugu-Bold.ttf",
        "headline": "మీ కుటుంబం సరైన ఇంటికి అర్హులు",
        "subtext": "RentIt లో ధృవీకరించిన లిస్టింగ్‌లను బ్రౌజ్ చేయండి",
        "cta": "నేడే ఉచితంగా డౌన్లోడ్ చేయండి"
    },
    "hindi": {
        "font": "fonts/NotoSansDevanagari-Bold.ttf",
        "headline": "आपका परिवार सही घर का हकदार है",
        "subtext": "RentIt पर सत्यापित लिस्टिंग ब्राउज़ करें",
        "cta": "आज मुफ्त डाउनलोड करें"
    }
}

def apply_text_overlay(
    input_video: str,
    output_video: str,
    language: str,
    video_height: int = 720
) -> bool:
    """
    Apply multilingual text overlay on video using FFmpeg.
    Uses Python subprocess to safely handle Unicode text.
    """
    config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["english"])

    def esc(text: str) -> str:
        return text.replace("'", "\u2019").replace(":", "\\:")

    # Resolve paths to absolute paths
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    font_path = os.path.join(base_dir, config['font']).replace('\\', '/')
    noto_sans_path = os.path.join(base_dir, 'fonts/NotoSans-Bold.ttf').replace('\\', '/')

    top_bar_h = 115
    bottom_bar_h = 125
    bottom_y = video_height - bottom_bar_h

    vf_filters = ",".join([
        "format=yuv420p",
        # Top dark bar
        f"drawbox=x=0:y=0:w=iw:h={top_bar_h}:color=black@0.6:t=fill",
        # Bottom dark bar
        f"drawbox=x=0:y={bottom_y}:w=iw:h={bottom_bar_h}:color=black@0.6:t=fill",
        # Brand name top center
        f"drawtext=fontfile='{noto_sans_path}':text='RentIt':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=18:shadowcolor=black@0.9:shadowx=3:shadowy=3",
        # Headline bottom
        f"drawtext=fontfile='{font_path}':text='{esc(config['headline'])}':fontcolor=white:fontsize=28:x=(w-text_w)/2:y={bottom_y + 15}:shadowcolor=black@0.9:shadowx=2:shadowy=2",
        # CTA bottom
        f"drawtext=fontfile='{font_path}':text='{esc(config['cta'])}':fontcolor=#FFD700:fontsize=22:x=(w-text_w)/2:y={bottom_y + 60}:shadowcolor=black@0.8:shadowx=1:shadowy=1",
    ])

    cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", vf_filters,
        "-c:v", "libx264", "-crf", "18", "-preset", "slow",
        "-c:a", "copy",
        output_video
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"FFmpeg Error for {language}: {result.stderr}")
    return result.returncode == 0

def generate_all_language_videos(
    input_video: str,
    languages: list,
    session_id: str
) -> dict:
    """
    Generate one overlaid video per language.
    Returns dict of { language: output_path }
    """
    outputs = {}
    os.makedirs("outputs/videos/overlaid", exist_ok=True)
    
    for lang in languages:
        lang = lang.lower()
        output_path = f"outputs/videos/overlaid/{session_id}_{lang}.mp4"
        success = apply_text_overlay(input_video, output_path, lang)
        if success:
            outputs[lang] = output_path
    return outputs
