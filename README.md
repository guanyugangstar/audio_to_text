# 音频转字幕APP

## 项目简介
本项目为网页端音频转字幕应用，支持用户上传音频文件（mp3、wav、m4a等），后端集成开源语音识别模型OpenAI Whisper，自动生成SRT字幕文件并支持下载。前端采用Next.js，后端采用FastAPI，所有依赖均为免费开源。

## 目录结构
```
├── backend/         # 后端FastAPI服务，Whisper模型集成
│   ├── main.py
│   └── requirements.txt
├── frontend/        # 前端Next.js项目，用户交互界面
│   ├── src/app/page.tsx
│   └── ...
├── README.md        # 项目说明
```

## 依赖安装
### 后端
1. 进入 backend 目录：
   ```bash
   cd backend
   ```
2. 创建虚拟环境（可选）：
   ```bash
   python -m venv venv
   # Windows: venv\Scripts\activate
   # Linux/Mac: source venv/bin/activate
   ```
3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
4. 首次运行时，Whisper模型会自动下载（默认base模型，约140MB）。

### 前端
1. 进入 frontend 目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```

## 启动方式
### 启动后端（FastAPI）
```bash
cd backend
uvicorn main:app --reload
```
默认监听 http://localhost:8000

### 启动前端（Next.js）
```bash
cd frontend
npm run dev
```
默认监听 http://localhost:3000

## 使用说明
1. 浏览器访问 http://localhost:3000
2. 上传音频文件（支持mp3、wav、m4a等）
3. 等待转写，状态栏显示"字幕生成成功"后，点击"下载SRT字幕"按钮即可下载字幕文件

## 常见问题
- 后端首次运行会自动下载Whisper模型，需联网
- 若端口被占用，可在启动命令中指定其他端口
- 前后端需分别启动，确保接口地址一致（如需跨域可在FastAPI中添加CORS中间件）
- 所有依赖均为免费开源，无需付费API

## 主要依赖
- 前端：Next.js, React, Tailwind CSS
- 后端：FastAPI, uvicorn, openai-whisper, python-multipart, pydantic
- 语音识别模型：OpenAI Whisper（官方Python库）

## 代码注释
所有核心函数和接口均有注释，便于理解和二次开发。

## 联系与反馈
如有问题或建议，欢迎提交issue或联系开发者。 