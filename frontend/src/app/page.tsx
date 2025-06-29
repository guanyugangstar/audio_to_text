"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>("text");
  const [loading, setLoading] = useState(false);
  const [srtContent, setSrtContent] = useState<string>("");
  const [downloading, setDownloading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSrtContent("");
      setDownloading(false);
    }
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value);
  };

  // 上传音频并请求转写
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(
        `http://localhost:8000/transcribe?format=${format}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) {
        const err = await res.text();
        alert("转写失败: " + err);
        setLoading(false);
        return;
      }
      const text = await res.text();
      // 自动下载文件
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      let ext = format;
      if (format === "text") ext = "txt";
      // 生成时间戳
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `transcription_${timestamp}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert("上传或转写出错");
    }
    setLoading(false);
  };

  // 下载SRT字幕
  const handleDownload = () => {
    if (!srtContent) return;
    setDownloading(true);
    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file ? file.name.replace(/\.[^.]+$/, ".srt") : "subtitle.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">音频转字幕APP</h1>
      <div className="w-full max-w-md p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="mb-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-100 dark:hover:file:bg-gray-600"
          onChange={handleFileChange}
        />
        <div style={{ margin: "16px 0" }}>
          <label htmlFor="format-select">字幕格式：</label>
          <select id="format-select" value={format} onChange={handleFormatChange} className="custom-select">
            <option value="text">纯文本（.txt）</option>
            <option value="srt">SRT字幕（.srt）</option>
            <option value="vtt">VTT字幕（.vtt）</option>
          </select>
          <span style={{ marginLeft: 8, color: '#888' }}>
            选择输出格式，SRT/VTT 可用于视频字幕
          </span>
        </div>
        <style jsx global>{`
          select.custom-select {
            background: #222;
            color: #fff;
            border: 1px solid #444;
          }
          select.custom-select option {
            background: #000;
            color: #fff;
          }
        `}</style>
        <button
          className="w-full py-2 px-4 mb-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? "正在转写..." : "上传并转写"}
        </button>
        {srtContent && (
          <button
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded mt-2"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "下载中..." : "下载SRT字幕"}
          </button>
        )}
      </div>
      <footer className="mt-10 text-xs text-gray-500 dark:text-gray-400">Powered by Next.js & FastAPI & Whisper</footer>
    </div>
  );
}
