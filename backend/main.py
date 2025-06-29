import logging
logging.basicConfig(level=logging.DEBUG)

from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import PlainTextResponse
import tempfile
import whisper
import os
from fastapi.middleware.cors import CORSMiddleware
# 新增 opencc 导入
try:
    from opencc import OpenCC
    opencc = OpenCC('t2s')  # 繁体转简体
except ImportError:
    opencc = None
    logging.error('opencc-python-reimplemented 未安装，无法进行简繁转换')

app = FastAPI()

# 允许本地前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载Whisper模型（首次运行会自动下载）
model = whisper.load_model("base")

def format_as_text(result: dict) -> str:
    return result.get("text", "")

def format_timestamp(seconds: float, srt: bool = True) -> str:
    # SRT: hh:mm:ss,SSS  VTT: hh:mm:ss.SSS
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    if srt:
        return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"
    else:
        return f"{hours:02}:{minutes:02}:{secs:02}.{millis:03}"

def format_as_srt(result: dict) -> str:
    segments = result.get("segments", [])
    lines = []
    for idx, seg in enumerate(segments, 1):
        start = format_timestamp(seg["start"], srt=True)
        end = format_timestamp(seg["end"], srt=True)
        text = seg["text"].strip()
        lines.append(f"{idx}\n{start} --> {end}\n{text}\n")
    return "\n".join(lines).strip()

def format_as_vtt(result: dict) -> str:
    segments = result.get("segments", [])
    lines = ["WEBVTT\n"]
    for seg in segments:
        start = format_timestamp(seg["start"], srt=False)
        end = format_timestamp(seg["end"], srt=False)
        text = seg["text"].strip()
        lines.append(f"{start} --> {end}\n{text}\n")
    return "\n".join(lines).strip()

def to_simplified(text: str) -> str:
    """
    将文本转换为简体中文，若 opencc 不可用则返回原文。
    """
    if opencc is not None:
        try:
            return opencc.convert(text)
        except Exception as e:
            logging.error(f'简繁转换失败: {e}')
            return text
    else:
        return text

@app.post("/transcribe", response_class=PlainTextResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    format: str = Query("text", description="字幕输出格式，可选：text、srt、vtt")
):
    """
    接收音频文件，调用Whisper进行转写，返回多种格式字幕内容。
    支持mp3、wav、m4a等常见格式。
    """
    supported_formats = {"text", "srt", "vtt"}
    if format not in supported_formats:
        return PlainTextResponse(
            f"不支持的格式：{format}。可选格式：text, srt, vtt",
            status_code=400
        )
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[-1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    try:
        result = model.transcribe(
            tmp_path,
            task="transcribe",
            fp16=False,
            verbose=False,
            initial_prompt=None,
            language="zh",  # 强制中文
            condition_on_previous_text=True,
            word_timestamps=False
        )
        if format == "text":
            output = format_as_text(result)
        elif format == "srt":
            output = format_as_srt(result)
        elif format == "vtt":
            output = format_as_vtt(result)
        # 统一做简繁转换
        output = to_simplified(output)
        return output
    except Exception as e:
        import traceback
        traceback.print_exc()
        return PlainTextResponse(f"转写失败: {str(e)}", status_code=500)
    finally:
        os.remove(tmp_path) 