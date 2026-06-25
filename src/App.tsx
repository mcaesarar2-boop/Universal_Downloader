import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Folder, 
  Play, 
  Check, 
  Copy, 
  Terminal, 
  Settings, 
  Layers, 
  AlertTriangle, 
  ExternalLink, 
  Cpu, 
  Video, 
  Music, 
  Globe, 
  HelpCircle, 
  RefreshCw, 
  FileCode, 
  Menu, 
  ChevronRight, 
  Info,
  Laptop,
  CheckCircle,
  XCircle,
  Code
} from 'lucide-react';

// Live CustomTkinter code that gets updated dynamically based on user choices
const generatePythonCode = (accentColor: string, defaultDir: string) => {
  const mappedAccent = accentColor === 'dark-blue' ? 'dark-blue' : accentColor;
  return `"""
Universal Video Downloader
A modern GUI desktop application using CustomTkinter and yt-dlp.
Supports YouTube, raw HLS (.m3u8), and other non-DRM websites.
Bypasses and ignores DRM-protected content safely.
"""

import os
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk
import yt_dlp

# Set appearance mode and color theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("${mappedAccent}")

class VideoDownloaderApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Configure window
        self.title("Universal Video Downloader")
        self.geometry("920x660")
        self.minimum_size = (800, 600)
        self.minsize(800, 600)
        
        # Grid layout (1 row, 2 columns)
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        
        # Active states
        self.fetched_info = None
        self.target_url = ""
        self.download_dir = r"${defaultDir}"
        if not os.path.exists(self.download_dir):
            self.download_dir = os.path.join(os.path.expanduser("~"), "Downloads")
        if not os.path.exists(self.download_dir):
            self.download_dir = os.getcwd()
            
        self.is_fetching = False
        self.is_downloading = False
        
        # Build UI Components
        self.create_sidebar()
        self.create_main_panel()
        
    def create_sidebar(self):
        # Sidebar Frame
        self.sidebar_frame = ctk.CTkFrame(self, width=220, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(4, weight=1)
        
        # Sidebar Widgets
        self.logo_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="Video Downloader", 
            font=ctk.CTkFont(size=18, weight="bold")
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 5))
        
        self.sub_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="yt-dlp GUI Engine", 
            font=ctk.CTkFont(size=11, slant="italic"),
            text_color="gray"
        )
        self.sub_label.grid(row=1, column=0, padx=20, pady=(0, 20))
        
        # Theme Accent selector
        self.theme_label = ctk.CTkLabel(self.sidebar_frame, text="Theme Accent:", anchor="w")
        self.theme_label.grid(row=2, column=0, padx=20, pady=(10, 0), sticky="w")
        self.theme_menu = ctk.CTkOptionMenu(
            self.sidebar_frame, 
            values=["blue", "green", "dark-blue"], 
            command=self.change_theme_color
        )
        self.theme_menu.grid(row=3, column=0, padx=20, pady=10, sticky="ew")
        self.theme_menu.set("${accentColor}")
        
        # Helper text for FFmpeg
        self.ffmpeg_info = ctk.CTkLabel(
            self.sidebar_frame, 
            text="FFmpeg Requirement:\\nEnsure 'ffmpeg' is installed\\non your system path\\nfor format merging and\\nHLS live stream processing.", 
            font=ctk.CTkFont(size=10), 
            text_color="gray",
            justify="left"
        )
        self.ffmpeg_info.grid(row=5, column=0, padx=20, pady=20, sticky="s")

    def create_main_panel(self):
        # Main Scrollable Frame to avoid component overflow on smaller screens
        self.main_frame = ctk.CTkScrollableFrame(self, corner_radius=0, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=15, pady=15)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        # Title Header
        self.title_label = ctk.CTkLabel(
            self.main_frame, 
            text="Universal Media Downloader", 
            font=ctk.CTkFont(size=22, weight="bold")
        )
        self.title_label.grid(row=0, column=0, padx=10, pady=(10, 20), sticky="w")
        
        # URL Input Section
        self.url_frame = ctk.CTkFrame(self.main_frame)
        self.url_frame.grid(row=1, column=0, padx=10, pady=10, sticky="ew")
        self.url_frame.grid_columnconfigure(0, weight=1)
        
        self.url_label = ctk.CTkLabel(
            self.url_frame, 
            text="Media Link or Stream (.m3u8, YouTube, Vimeo, etc.):", 
            font=ctk.CTkFont(weight="bold")
        )
        self.url_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")
        
        self.url_entry = ctk.CTkEntry(
            self.url_frame, 
            placeholder_text="Paste video page link or .m3u8 manifest link here..."
        )
        self.url_entry.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
        
        self.fetch_btn = ctk.CTkButton(
            self.url_frame, 
            text="Fetch Video Info", 
            command=self.start_fetch_info,
            width=130
        )
        self.fetch_btn.grid(row=1, column=1, padx=15, pady=(0, 15))
        
        # Metadata Information Section
        self.info_frame = ctk.CTkFrame(self.main_frame)
        self.info_frame.grid(row=2, column=0, padx=10, pady=10, sticky="ew")
        self.info_frame.grid_columnconfigure(1, weight=1)
        
        self.meta_title_lbl = ctk.CTkLabel(
            self.info_frame, 
            text="Title: Fetch details to display video title", 
            font=ctk.CTkFont(size=13, weight="bold"), 
            anchor="w"
        )
        self.meta_title_lbl.grid(row=0, column=0, columnspan=2, padx=15, pady=(10, 5), sticky="ew")
        
        self.meta_duration_lbl = ctk.CTkLabel(self.info_frame, text="Duration: --:--", text_color="gray", anchor="w")
        self.meta_duration_lbl.grid(row=1, column=0, padx=15, pady=(0, 10), sticky="w")
        
        self.meta_uploader_lbl = ctk.CTkLabel(self.info_frame, text="Source Domain: N/A", text_color="gray", anchor="w")
        self.meta_uploader_lbl.grid(row=1, column=1, padx=15, pady=(0, 10), sticky="w")
        
        # Download Controls Section
        self.controls_frame = ctk.CTkFrame(self.main_frame)
        self.controls_frame.grid(row=3, column=0, padx=10, pady=10, sticky="ew")
        self.controls_frame.grid_columnconfigure(0, weight=1)
        self.controls_frame.grid_columnconfigure(1, weight=1)
        
        # Resolution Dropdown
        self.format_label = ctk.CTkLabel(
            self.controls_frame, 
            text="Select Quality Format:", 
            font=ctk.CTkFont(weight="bold")
        )
        self.format_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")
        self.format_menu = ctk.CTkOptionMenu(
            self.controls_frame, 
            values=["Please Fetch Info First"]
        )
        self.format_menu.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
        
        # Save Location
        self.dir_label = ctk.CTkLabel(
            self.controls_frame, 
            text="Destination Directory:", 
            font=ctk.CTkFont(weight="bold")
        )
        self.dir_label.grid(row=0, column=1, padx=15, pady=(10, 5), sticky="w")
        
        self.dir_sub_frame = ctk.CTkFrame(self.controls_frame, fg_color="transparent")
        self.dir_sub_frame.grid(row=1, column=1, padx=15, pady=(0, 15), sticky="ew")
        self.dir_sub_frame.grid_columnconfigure(0, weight=1)
        
        self.dir_entry = ctk.CTkEntry(self.dir_sub_frame)
        self.dir_entry.insert(0, self.download_dir)
        self.dir_entry.grid(row=0, column=0, padx=(0, 10), sticky="ew")
        
        self.browse_btn = ctk.CTkButton(
            self.dir_sub_frame, 
            text="Browse", 
            width=80, 
            command=self.browse_directory
        )
        self.browse_btn.grid(row=0, column=1)
        
        # Start Download Button
        self.download_btn = ctk.CTkButton(
            self.main_frame, 
            text="Start Media Download", 
            height=42, 
            font=ctk.CTkFont(size=14, weight="bold"), 
            state="disabled", 
            command=self.start_download
        )
        self.download_btn.grid(row=4, column=0, padx=10, pady=15, sticky="ew")
        
        # Live Stats Block
        self.feedback_frame = ctk.CTkFrame(self.main_frame)
        self.feedback_frame.grid(row=5, column=0, padx=10, pady=10, sticky="ew")
        self.feedback_frame.grid_columnconfigure(0, weight=3)
        self.feedback_frame.grid_columnconfigure(1, weight=1)
        self.feedback_frame.grid_columnconfigure(2, weight=1)
        self.feedback_frame.grid_columnconfigure(3, weight=1)
        
        self.progress_bar = ctk.CTkProgressBar(self.feedback_frame)
        self.progress_bar.grid(row=0, column=0, columnspan=4, padx=15, pady=(15, 10), sticky="ew")
        self.progress_bar.set(0)
        
        self.speed_lbl = ctk.CTkLabel(self.feedback_frame, text="Speed: -- KB/s", anchor="w")
        self.speed_lbl.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="w")
        
        self.eta_lbl = ctk.CTkLabel(self.feedback_frame, text="ETA: --:--", anchor="w")
        self.eta_lbl.grid(row=1, column=1, padx=15, pady=(0, 15), sticky="w")
        
        self.size_lbl = ctk.CTkLabel(self.feedback_frame, text="Size: 0.0 MB", anchor="w")
        self.size_lbl.grid(row=1, column=2, padx=15, pady=(0, 15), sticky="w")
        
        self.percent_lbl = ctk.CTkLabel(
            self.feedback_frame, 
            text="0.0%", 
            font=ctk.CTkFont(weight="bold")
        )
        self.percent_lbl.grid(row=1, column=3, padx=15, pady=(0, 15), sticky="e")
        
        # Real-time Log Console Widget
        self.log_label = ctk.CTkLabel(
            self.main_frame, 
            text="System Log Console / yt-dlp Status:", 
            font=ctk.CTkFont(weight="bold")
        )
        self.log_label.grid(row=6, column=0, padx=10, pady=(10, 0), sticky="w")
        
        self.log_text = ctk.CTkTextbox(
            self.main_frame, 
            height=160, 
            font=ctk.CTkFont(family="Courier", size=11)
        )
        self.log_text.grid(row=7, column=0, padx=10, pady=(5, 10), sticky="ew")
        self.log_text.configure(state="disabled")
        
        self.write_log("Application Engine initialized successfully. Ready to paste links.")

    def change_theme_color(self, choice):
        ctk.set_default_color_theme(choice)
        self.write_log(f"Theme color switched to: {choice}. Refresh window to apply fully.")

    def browse_directory(self):
        selected = filedialog.askdirectory(initialdir=self.download_dir, title="Select Output Save Folder")
        if selected:
            self.download_dir = selected
            self.dir_entry.delete(0, tk.END)
            self.dir_entry.insert(0, selected)
            self.write_log(f"Output folder path updated: {selected}")

    def write_log(self, text):
        # Insert log messages safely into the custom text box widget
        self.log_text.configure(state="normal")
        self.log_text.insert(tk.END, f"{text}\\n")
        self.log_text.see(tk.END)
        self.log_text.configure(state="disabled")

    # Threading setup to prevent UI lock during network calls
    def start_fetch_info(self):
        url = self.url_entry.get().strip()
        if not url:
            messagebox.showerror("Validation Error", "Please paste a video or .m3u8 link first!")
            return
            
        if self.is_fetching or self.is_downloading:
            return
            
        self.is_fetching = True
        self.fetch_btn.configure(state="disabled")
        self.write_log(f"Querying URL metadata asynchronously: {url}")
        
        # Launch worker in background thread
        t = threading.Thread(target=self._fetch_info_worker, args=(url,), daemon=True)
        t.start()

    def _fetch_info_worker(self, url):
        # Requirement #1: Explicitly bypass DRM sites (e.g. Netflix, Hulu)
        drm_sites = ["netflix.com", "hulu.com", "disneyplus.com", "hbo.com", "hbomax.com", "amazon.com/prime-video"]
        if any(site in url.lower() for site in drm_sites):
            self.after(
                0, 
                lambda: self._on_fetch_failed(
                    "DRM Protected Site Detected. DRM content downloads are explicitly bypassed & ignored per system requirements."
                )
            )
            return
            
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
            self.after(0, lambda: self._on_fetch_success(info, url))
        except Exception as e:
            self.after(0, lambda: self._on_fetch_failed(str(e)))

    def _on_fetch_success(self, info, url):
        self.is_fetching = False
        self.fetch_btn.configure(state="normal")
        self.fetched_info = info
        self.target_url = url
        
        # Display title and metadata info
        title = info.get('title', 'Unknown Title')
        duration = info.get('duration', 0)
        extractor = info.get('extractor_key', 'Generic URL')
        
        mins, secs = divmod(duration, 60)
        hours, mins = divmod(mins, 60)
        duration_str = f"{hours:02d}:{mins:02d}:{secs:02d}" if hours else f"{mins:02d}:{secs:02d}"
        
        self.meta_title_lbl.configure(text=f"Title: {title}")
        self.meta_duration_lbl.configure(text=f"Duration: {duration_str}")
        self.meta_uploader_lbl.configure(text=f"Source: {extractor}")
        
        # Build quality dropdown items
        formats = info.get('formats', [])
        format_options = ["Best Resolution (Merged Auto)"]
        
        seen_res = set()
        for f in formats:
            height = f.get('height')
            ext = f.get('ext', '')
            if height and height not in seen_res:
                seen_res.add(height)
                format_options.append(f"{height}p - {ext.upper()} (Video + Audio Merger)")
                
        format_options.append("Best Audio Only (M4A/MP3)")
        
        self.format_menu.configure(values=format_options)
        self.format_menu.set(format_options[0])
        self.download_btn.configure(state="normal")
        self.write_log(f"Successfully extracted video details for: '{title}'")

    def _on_fetch_failed(self, err_msg):
        self.is_fetching = False
        self.fetch_btn.configure(state="normal")
        self.download_btn.configure(state="disabled")
        self.meta_title_lbl.configure(text="Title: Extraction Failed")
        self.meta_duration_lbl.configure(text="Duration: --:--")
        self.meta_uploader_lbl.configure(text="Source: N/A")
        
        self.write_log(f"METADATA ERROR: {err_msg}")
        messagebox.showerror("Extraction Error", f"Could not fetch details:\\n{err_msg}")

    # Launch download in secondary thread to preserve responsiveness
    def start_download(self):
        if not self.fetched_info or self.is_downloading:
            return
            
        self.is_downloading = True
        self.download_btn.configure(state="disabled", text="Downloading Media Tracks...")
        self.fetch_btn.configure(state="disabled")
        
        # Clear stats GUI
        self.progress_bar.set(0)
        self.percent_lbl.configure(text="0.0%")
        self.speed_lbl.configure(text="Speed: Connecting...")
        self.eta_lbl.configure(text="ETA: Calculating...")
        self.size_lbl.configure(text="Size: -- MB")
        
        self.write_log("Starting asynchronous download process...")
        t = threading.Thread(target=self._download_worker, daemon=True)
        t.start()

    def _download_worker(self):
        url = self.target_url
        selected_fmt = self.format_menu.get()
        out_dir = self.dir_entry.get().strip() or self.download_dir
        out_path_template = os.path.join(out_dir, "%(title)s.%(ext)s")
        
        # Map selected resolution option to standard yt-dlp queries
        format_query = "bestvideo+bestaudio/best"
        if "Audio Only" in selected_fmt:
            format_query = "bestaudio/best"
        elif "p" in selected_fmt:
            res = selected_fmt.split("p")[0].strip()
            format_query = f"bestvideo[height<={res}]+bestaudio/best[height<={res}]"

        # Safe custom logger class to pipe yt-dlp logs directly into the GUI
        class GUIStreamLogger:
            def __init__(self, app):
                self.app = app
            def debug(self, msg):
                if msg.startswith("[debug]") or msg.strip() == "": return
                self.app.after(0, lambda: self.app.write_log(msg))
            def info(self, msg):
                self.app.after(0, lambda: self.app.write_log(msg))
            def warning(self, msg):
                self.app.after(0, lambda: self.app.write_log(f"WARNING: {msg}"))
            def error(self, msg):
                self.app.after(0, lambda: self.app.write_log(f"ERROR: {msg}"))

        # Progress hooks callback
        def download_progress_hook(d):
            if d['status'] == 'downloading':
                total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes', 0)
                speed = d.get('speed', 0)
                eta = d.get('eta', 0)
                
                pct = (downloaded / total * 100) if total > 0 else 0
                size_mb = total / (1024 * 1024) if total else 0
                
                speed_str = "0 KB/s"
                if speed:
                    if speed > 1024 * 1024:
                        speed_str = f"{speed / (1024 * 1024):.1f} MB/s"
                    else:
                        speed_str = f"{speed / 1024:.0f} KB/s"
                        
                eta_str = "--:--"
                if eta:
                    m, s = divmod(eta, 60)
                    eta_str = f"{m:02d}:{s:02d}"
                    
                self.after(0, lambda: self._update_gui_progress(pct, speed_str, eta_str, size_mb))
            elif d['status'] == 'finished':
                self.after(0, lambda: self.write_log("Download finished. Initiating ffmpeg merger..."))

        ydl_opts = {
            'format': format_query,
            'outtmpl': out_path_template,
            'logger': GUIStreamLogger(self),
            'progress_hooks': [download_progress_hook],
            'merge_output_format': 'mp4',
            'noplaylist': True,
        }
        
        if "Audio Only" in selected_fmt:
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            self.after(0, self._on_download_complete)
        except Exception as e:
            self.after(0, lambda: self._on_download_failed(str(e)))

    def _update_gui_progress(self, percent, speed_str, eta_str, size_mb):
        self.progress_bar.set(percent / 100)
        self.percent_lbl.configure(text=f"{percent:.1f}%")
        self.speed_lbl.configure(text=f"Speed: {speed_str}")
        self.eta_lbl.configure(text=f"ETA: {eta_str}")
        self.size_lbl.configure(text=f"Size: {size_mb:.1f} MB")

    def _on_download_complete(self):
        self.is_downloading = False
        self.download_btn.configure(state="normal", text="Start Media Download")
        self.fetch_btn.configure(state="normal")
        self.progress_bar.set(1.0)
        self.percent_lbl.configure(text="100.0%")
        self.speed_lbl.configure(text="Speed: Complete")
        self.eta_lbl.configure(text="ETA: Finished")
        
        self.write_log("DOWNLOAD SUCCESS: Saved & processed stream format merges.")
        messagebox.showinfo("Download Complete", "Media has been downloaded and processed correctly!")

    def _on_download_failed(self, error):
        self.is_downloading = False
        self.download_btn.configure(state="normal", text="Start Media Download")
        self.fetch_btn.configure(state="normal")
        self.write_log(f"DOWNLOAD ERROR: {error}")
        messagebox.showerror("Error", f"Failed to download video:\\n{error}")

if __name__ == "__main__":
    app = VideoDownloaderApp()
    app.mainloop()
`;
};

// URL Presets for the interactive simulator
interface Preset {
  name: string;
  url: string;
  icon: React.ReactNode;
  duration: number;
  title: string;
  uploader: string;
  formats: string[];
  type: 'youtube' | 'm3u8' | 'vimeo' | 'drm';
}

const PRESETS: Preset[] = [
  {
    name: 'YouTube Standard (1080p)',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    icon: <Video className="w-4 h-4 text-red-500" />,
    duration: 342,
    title: 'How Rockets Work - SpaceX Flight Mechanics 101',
    uploader: 'RocketScienceHQ',
    formats: [
      '1080p - MP4 (124.5 MB)',
      '720p - MP4 (68.2 MB)',
      '480p - MP4 (34.0 MB)',
      'Best Audio Only - M4A (12.4 MB)'
    ],
    type: 'youtube'
  },
  {
    name: 'Raw HLS Live Stream (.m3u8)',
    url: 'https://streaming.service.example/live/news_feed.m3u8',
    icon: <Globe className="w-4 h-4 text-blue-400" />,
    duration: 0, // live stream
    title: 'Global Live News Feed - Broadcast Manifest',
    uploader: 'GlobalBroadcastCorp',
    formats: [
      'Best Resolution Merged (.mp4) (~2.4 MB/min)',
      'Stream Resolution 720p (.mp4) (~1.8 MB/min)',
      'Audio Stream Track Only (.aac) (~0.4 MB/min)'
    ],
    type: 'm3u8'
  },
  {
    name: 'Vimeo Cinematic Short (4K)',
    url: 'https://vimeo.com/894732104',
    icon: <Play className="w-4 h-4 text-sky-400" />,
    duration: 128,
    title: 'Over the Glacier - Cinematic drone sequence of Svalbard',
    uploader: 'NordicFocusFilms',
    formats: [
      '2160p (4K) - MKV (285.0 MB)',
      '1080p - MP4 (92.5 MB)',
      '720p - MP4 (44.2 MB)',
      'Best Audio Only - M4A (4.1 MB)'
    ],
    type: 'vimeo'
  },
  {
    name: 'Netflix Stream (DRM Blocked)',
    url: 'https://www.netflix.com/title/80100172',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    duration: 0,
    title: 'Locked Content',
    uploader: 'Netflix Inc.',
    formats: [],
    type: 'drm'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'emulator' | 'code' | 'commands' | 'setup'>('emulator');
  
  // Customization state that updates Python code live
  const [accentColor, setAccentColor] = useState<string>('blue');
  const [defaultDir, setDefaultDir] = useState<string>('C:\\\\Users\\\\User\\\\Downloads');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Elegant floating notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Simulator specific state
  const [simulatorUrl, setSimulatorUrl] = useState<string>('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  const [isFetchingSim, setIsFetchingSim] = useState<boolean>(false);
  const [simMetadata, setSimMetadata] = useState<Preset | null>(null);
  const [selectedFormatSim, setSelectedFormatSim] = useState<string>('');
  const [simSaveDir, setSimSaveDir] = useState<string>('/Users/developer/Downloads');
  const [isDownloadingSim, setIsDownloadingSim] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<string>('0 KB/s');
  const [simEta, setSimEta] = useState<string>('--:--');
  const [simSize, setSimSize] = useState<string>('0.0 MB');
  const [simLogs, setSimLogs] = useState<string[]>([
    'Application initialized successfully. Ready to analyze video URL inputs.',
    'System path scanned: Python v3.11.4 found, yt-dlp core loaded (v2025.01.15).'
  ]);

  // Command generator state
  const [cliUrl, setCliUrl] = useState<string>('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  const [cliFormat, setCliFormat] = useState<string>('merged');
  const [cliRes, setCliRes] = useState<string>('1080');
  const [cliSubtitles, setCliSubtitles] = useState<boolean>(true);
  const [cliThumbnail, setCliThumbnail] = useState<boolean>(true);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  // Auto-scroll logs Ref
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simLogs]);

  // Handler to copy code block
  const handleCopyCode = () => {
    const code = generatePythonCode(accentColor, defaultDir);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast("Successfully copied downloader.py script to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper to trigger direct python script download
  const handleDownloadPyScript = () => {
    const code = generatePythonCode(accentColor, defaultDir);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'downloader.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick select preset
  const handleSelectPreset = (preset: Preset) => {
    setSimulatorUrl(preset.url);
    addLog(`Pasted preset link: ${preset.url}`);
  };

  // Add a log line to simulated console
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSimLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Run simulated fetch metadata info
  const handleSimFetchInfo = () => {
    if (!simulatorUrl.trim()) {
      addLog('ERROR: URL input is empty. Paste a link first.');
      return;
    }

    setIsFetchingSim(true);
    setSimMetadata(null);
    addLog(`[extractor] Initiating connection to check domain permissions...`);
    addLog(`[downloader] Fetching HTML/Metadata payload for URL: ${simulatorUrl}`);

    // Simulate network latency
    setTimeout(() => {
      // Check if it's DRM site
      const isDRM = simulatorUrl.toLowerCase().includes('netflix.com') || 
                    simulatorUrl.toLowerCase().includes('hulu.com') ||
                    simulatorUrl.toLowerCase().includes('disneyplus.com') ||
                    simulatorUrl.toLowerCase().includes('hbo.com');

      if (isDRM) {
        addLog('WARNING: Site relies on DRM-protected streaming tokens (Netflix/Hulu).');
        addLog('ERROR: [DRM Bypass Engine] Ignored/bypassed DRM stream key matching system requirements.');
        setIsFetchingSim(false);
        showToast('DRM Error: Netflix/Hulu DRM content is bypassed & ignored per policy constraints.');
        return;
      }

      // Find matching preset, else use generic mock info
      const foundPreset = PRESETS.find(p => simulatorUrl.toLowerCase().includes(p.type)) || {
        name: 'Generic URL Audio/Video Stream',
        url: simulatorUrl,
        duration: 254,
        title: 'Custom Analyzed Online Video stream track',
        uploader: 'WebMediaGateway',
        formats: [
          '1080p - MP4 (Merged Stream)',
          '720p - MP4 (Merged Stream)',
          'Best Audio Only - M4A (Audio Only)'
        ],
        type: 'youtube' as const
      };

      setSimMetadata(foundPreset as Preset);
      setSelectedFormatSim((foundPreset as Preset).formats[0]);
      setIsFetchingSim(false);
      addLog(`[info] Title parsed successfully: "${foundPreset.title}"`);
      addLog(`[info] Extractor found: ${foundPreset.uploader} (${foundPreset.duration ? foundPreset.duration + ' seconds' : 'Live stream'})`);
      addLog(`[info] Available formats extracted successfully.`);
    }, 1200);
  };

  // Run simulated media download
  const handleSimDownload = () => {
    if (!simMetadata) return;
    setIsDownloadingSim(true);
    setSimProgress(0);
    setSimSpeed('0 KB/s');
    setSimEta('Calculating...');
    addLog(`[download] Starting format pipeline for format query: ${selectedFormatSim}`);
    addLog(`[download] Saving output file to directory: ${simSaveDir}`);
    addLog(`[download] Destination file template: ${simMetadata.title}.mp4`);

    let progressValue = 0;
    const speedOptions = ['4.2 MB/s', '5.1 MB/s', '3.8 MB/s', '4.9 MB/s', '5.5 MB/s', '2.1 MB/s'];
    const totalSize = simMetadata.duration === 0 ? 'Live Stream Buffer' : '48.5 MB';
    setSimSize(totalSize);

    const interval = setInterval(() => {
      progressValue += Math.floor(Math.random() * 15) + 5;
      if (progressValue >= 100) {
        progressValue = 100;
        setSimProgress(100);
        setSimSpeed('Finished');
        setSimEta('Done');
        setIsDownloadingSim(false);
        addLog(`[download] 100% of ${totalSize} downloaded successfully.`);
        addLog(`[ffmpeg] Stream tracks located. Triggering video & audio multiplex merging...`);
        
        setTimeout(() => {
          addLog(`[ffmpeg] Frame merge complete. Saved inside "${simSaveDir}/${simMetadata.title}.mp4"`);
          addLog(`SUCCESS: Media download sequence completed without error.`);
          clearInterval(interval);
        }, 800);
      } else {
        setSimProgress(progressValue);
        const randomSpeed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
        setSimSpeed(randomSpeed);
        const remainingSeconds = Math.max(1, Math.round(((100 - progressValue) / 10)));
        setSimEta(`00:${remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds}`);
        addLog(`[download] ${progressValue.toFixed(1)}% completed at speed ${randomSpeed}`);
      }
    }, 500);
  };

  // Command line builder
  const generatedCliCommand = `yt-dlp ${
    cliFormat === 'audio' 
      ? '-x --audio-format mp3 --audio-quality 192K' 
      : `-f "bestvideo[height<=${cliRes}]+bestaudio/best"`
  }${
    cliSubtitles ? ' --write-subs --sub-langs "en,es"' : ''
  }${
    cliThumbnail ? ' --write-thumbnail' : ''
  } --merge-output-format mp4 -o "~/Downloads/%(title)s.%(ext)s" "${cliUrl || 'https://...'}"`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(generatedCliCommand);
    setCopiedCli(true);
    showToast("Successfully copied shell command to clipboard!");
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Toast Notification overlay */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[100] bg-slate-900 border border-emerald-500/30 text-emerald-400 font-medium px-4 py-3 rounded-xl shadow-2xl shadow-emerald-500/10 flex items-center gap-2.5 transition-all animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-200">{toastMessage}</span>
        </div>
      )}
      
      {/* Premium Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2.5 rounded-xl text-slate-950 shadow-lg shadow-emerald-500/20">
            <Cpu className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Universal Video Downloader
              <span className="text-xs font-normal bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">v1.0.0</span>
            </h1>
            <p className="text-xs text-slate-400">Desktop Python CustomTkinter Application & yt-dlp Tool Suite</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            id="header-download-btn"
            onClick={handleDownloadPyScript}
            className="flex items-center gap-2 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-all active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download python script
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tab Controls for entire screen workspace */}
        <div className="col-span-12 flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            id="tab-emulator"
            onClick={() => setActiveTab('emulator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'emulator' 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Interactive Desktop Emulator
          </button>
          
          <button
            id="tab-code"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'code' 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            Python Source Code (`downloader.py`)
          </button>

          <button
            id="tab-commands"
            onClick={() => setActiveTab('commands')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'commands' 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            CLI yt-dlp Command Generator
          </button>

          <button
            id="tab-setup"
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'setup' 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Installation & Setup Guide
          </button>
        </div>

        {/* Content Tabs Switcher */}
        <div className="col-span-12 lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* EMULATOR TAB VIEW */}
          {activeTab === 'emulator' && (
            <>
              {/* Left Column: Interactive App Emulator Mockup */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-semibold text-slate-300 flex items-center gap-2">
                    <span>Live GUI Simulation Workspace</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </h2>
                  <p className="text-xs text-slate-500">Simulates real background threads & yt-dlp callbacks</p>
                </div>

                {/* Desktop Shell container */}
                <div id="desktop-emulator-frame" className="border border-slate-800 rounded-xl bg-slate-900/90 shadow-2xl shadow-black overflow-hidden flex flex-col">
                  
                  {/* OS Chrome Header */}
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/95 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/95 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-green-500/95 inline-block"></span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
                      <Laptop className="w-3 h-3" />
                      Universal Video Downloader (Python UI Simulator)
                    </div>
                    <div className="w-12"></div>
                  </div>

                  {/* Simulator Main Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                    
                    {/* Simulator Sidebar Frame */}
                    <div className="md:col-span-3 bg-slate-950/60 border-r border-slate-800/80 p-4 flex flex-col justify-between">
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Downloader App</p>
                          <h3 className="text-sm font-bold text-white">YTDL Client</h3>
                          <p className="text-[10px] text-slate-400 italic">CustomTkinter Interface</p>
                        </div>

                        <div className="border-t border-slate-800/80 pt-3">
                          <label className="text-[11px] text-slate-400 block mb-1">Theme Accent:</label>
                          <select 
                            id="sim-theme-selector"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1.5 font-medium focus:outline-none focus:border-emerald-500"
                          >
                            <option value="blue">Blue Accent</option>
                            <option value="green">Green Accent</option>
                            <option value="dark-blue">Dark Blue Accent</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 bg-slate-900/50 p-2.5 rounded border border-slate-800/40">
                        <span className="font-semibold text-slate-400 block mb-0.5">FFmpeg Check:</span>
                        Requires FFmpeg on terminal PATH to merge resolution formats properly.
                      </div>
                    </div>

                    {/* Simulator Content Area */}
                    <div className="md:col-span-9 p-5 flex flex-col gap-4 overflow-y-auto">
                      
                      {/* URL Paste Box */}
                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2">
                        <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Paste Media Stream Link</label>
                        <div className="flex gap-2">
                          <input 
                            id="sim-url-input"
                            type="text" 
                            placeholder="Paste Youtube or HLS (.m3u8) video URL..." 
                            value={simulatorUrl}
                            onChange={(e) => setSimulatorUrl(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                          />
                          <button 
                            id="sim-fetch-btn"
                            onClick={handleSimFetchInfo}
                            disabled={isFetchingSim || isDownloadingSim}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all text-slate-950 cursor-pointer ${
                              accentColor === 'green' 
                                ? 'bg-emerald-400 hover:bg-emerald-300' 
                                : accentColor === 'dark-blue'
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                  : 'bg-sky-400 hover:bg-sky-300'
                            } disabled:opacity-50`}
                          >
                            {isFetchingSim ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              'Fetch Info'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Fetched Info Card */}
                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3.5 flex flex-col gap-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded uppercase font-semibold">Metadata Summary</span>
                          </div>
                          {simMetadata && (
                            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Ready to Download
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-12 gap-3 mt-1">
                          <div className="col-span-12 md:col-span-8">
                            <span className="text-[10px] text-slate-500 block">Video/Stream Title</span>
                            <span className="text-xs font-bold text-white line-clamp-1">
                              {simMetadata ? simMetadata.title : 'Title not loaded yet. Paste URL above.'}
                            </span>
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <span className="text-[10px] text-slate-500 block">Duration</span>
                            <span className="text-xs font-semibold text-slate-300">
                              {simMetadata ? (simMetadata.duration === 0 ? 'Live Stream' : `${Math.floor(simMetadata.duration / 60)}m ${simMetadata.duration % 60}s`) : '--:--'}
                            </span>
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <span className="text-[10px] text-slate-500 block">Provider</span>
                            <span className="text-xs font-semibold text-slate-300">
                              {simMetadata ? simMetadata.uploader : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Download controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Format selector */}
                        <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Select Target Format</label>
                          <select 
                            id="sim-format-selector"
                            disabled={!simMetadata || isDownloadingSim}
                            value={selectedFormatSim}
                            onChange={(e) => setSelectedFormatSim(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-2.5 py-1.5 font-medium focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                          >
                            {!simMetadata ? (
                              <option>Please Fetch Info First</option>
                            ) : (
                              simMetadata.formats.map((f, idx) => (
                                <option key={idx} value={f}>{f}</option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Save location */}
                        <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Download Save Directory</label>
                          <div className="flex gap-1.5">
                            <input 
                              id="sim-save-dir-input"
                              type="text" 
                              value={simSaveDir} 
                              onChange={(e) => setSimSaveDir(e.target.value)}
                              disabled={isDownloadingSim}
                              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
                            />
                            <button 
                              id="sim-browse-btn"
                              disabled={isDownloadingSim}
                              onClick={() => {
                                const val = prompt("Enter simulated folder location path:", simSaveDir);
                                if (val) setSimSaveDir(val);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium px-2.5 py-1 rounded disabled:opacity-50 cursor-pointer"
                            >
                              Browse
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Download trigger */}
                      <button 
                        id="sim-download-btn"
                        onClick={handleSimDownload}
                        disabled={!simMetadata || isDownloadingSim || isFetchingSim}
                        className={`w-full py-2.5 rounded font-bold text-sm tracking-wide transition-all shadow flex items-center justify-center gap-2 cursor-pointer ${
                          !simMetadata 
                            ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                            : isDownloadingSim
                              ? 'bg-slate-900 border border-slate-800 text-emerald-500 cursor-wait'
                              : accentColor === 'green' 
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/15'
                                : accentColor === 'dark-blue'
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/15'
                                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/15'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        {isDownloadingSim ? 'Downloading Stream Frames...' : 'Start GUI Video Download'}
                      </button>

                      {/* Live stats */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                          <span>Progress Meter</span>
                          <span className="text-white font-bold">{simProgress.toFixed(0)}%</span>
                        </div>
                        
                        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full transition-all duration-300 rounded-full ${
                              accentColor === 'green' ? 'bg-emerald-500' : accentColor === 'dark-blue' ? 'bg-blue-500' : 'bg-sky-400'
                            }`}
                            style={{ width: `${simProgress}%` }}
                          ></div>
                        </div>

                        <div className="grid grid-cols-3 mt-3 text-center text-xs font-mono border-t border-slate-800/40 pt-2 text-slate-300">
                          <div className="border-r border-slate-800/50">
                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Speed</span>
                            <span className="font-bold">{simSpeed}</span>
                          </div>
                          <div className="border-r border-slate-800/50">
                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">ETA</span>
                            <span className="font-bold">{simEta}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">File Size</span>
                            <span className="font-bold">{simSize}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Log console footer */}
                  <div className="border-t border-slate-800/90 bg-slate-950 p-3">
                    <div className="flex items-center justify-between px-1 mb-2 text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        Terminal Diagnostics Log Stream (yt-dlp callback pipe)
                      </span>
                      <button 
                        id="clear-logs-btn"
                        onClick={() => setSimLogs([])} 
                        className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        Clear Terminal
                      </button>
                    </div>

                    <div className="bg-slate-900/80 rounded border border-slate-800 p-2.5 font-mono text-[11px] text-slate-300 h-28 overflow-y-auto flex flex-col gap-1 select-text">
                      {simLogs.map((log, index) => (
                        <div key={index} className="leading-relaxed">
                          <span className="text-slate-500 mr-2">&gt;</span>
                          <span className={
                            log.includes('SUCCESS') 
                              ? 'text-emerald-400 font-semibold' 
                              : log.includes('ERROR') || log.includes('WARNING')
                                ? 'text-amber-500 font-semibold'
                                : 'text-slate-300'
                          }>
                            {log}
                          </span>
                        </div>
                      ))}
                      <div ref={logEndRef}></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Simulator Presets & Info Cards */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Simulator Presets Selection */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-white text-md flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Emulator URL Presets
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Select pre-configured source links to witness various downloader outcomes:</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(p)}
                        className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all hover:bg-slate-800 group cursor-pointer ${
                          simulatorUrl === p.url 
                            ? 'bg-slate-800 border-slate-600 text-white shadow-md' 
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded group-hover:border-slate-700">
                            {p.icon}
                          </div>
                          <div>
                            <span className="text-xs font-semibold block text-slate-200">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[200px] sm:max-w-[300px]">{p.url}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 flex gap-3 text-xs leading-relaxed text-slate-300">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-400">Multi-threaded Design:</strong> Both metadata parsing and download cycles run as distinct background workers, preserving main GUI events so mouse drags, selections, and theme color transitions never stutter or experience locks.
                    </div>
                  </div>
                </div>

                {/* Quick Info & Features block */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="font-bold text-white text-md">Feature Integration Overview</h3>
                  
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
                      <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Asynchronous yt-dlp API Core
                      </h4>
                      <p className="text-slate-400">Taps into python's standard sub-threading framework, safely calling the native <code className="text-emerald-400 font-mono">yt_dlp.YoutubeDL</code> engine while streaming real-time status output.</p>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
                      <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Unified Progress Hooks
                      </h4>
                      <p className="text-slate-400">Converts technical raw block buffers and stream callbacks into readable percentage fractions, human-friendly download speed metrics (e.g. MB/s), and calculated time predictions (ETA).</p>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
                      <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        DRM Content Safety Bypass
                      </h4>
                      <p className="text-slate-400">Strict safety protocols bypass DRM encryption layers (such as Widevine, FairPlay) gracefully reporting error alerts instead of leading to script crashes.</p>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* PYTHON SOURCE CODE TAB VIEW */}
          {activeTab === 'code' && (
            <div className="col-span-12 flex flex-col gap-4">
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-emerald-400" />
                      downloader.py Source Code
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Customize default parameters live using the generator controls below:</p>
                  </div>
                  
                  {/* Dynamic Settings */}
                  <div className="flex flex-wrap items-center gap-4 bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-400">Default Theme Color:</span>
                      <select 
                        id="code-theme-selector"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2 py-1 rounded"
                      >
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="dark-blue">Dark-Blue</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-400">Default Save Path:</span>
                      <input 
                        id="code-save-dir"
                        type="text" 
                        value={defaultDir}
                        onChange={(e) => setDefaultDir(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2 py-1 rounded font-mono w-52"
                      />
                    </div>
                  </div>
                </div>

                {/* Code Window controls */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                    <span className="text-xs text-slate-400 font-mono">downloader.py (Ready for execution)</span>
                    <div className="flex items-center gap-2">
                      <button 
                        id="copy-code-btn"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? 'Copied' : 'Copy Code'}
                      </button>
                      <button 
                        id="download-script-btn"
                        onClick={handleDownloadPyScript}
                        className="flex items-center gap-1.5 text-xs text-slate-950 font-bold bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </button>
                    </div>
                  </div>

                  <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 selection:bg-slate-800">
                    <pre className="whitespace-pre">{generatePythonCode(accentColor, defaultDir)}</pre>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* COMMAND LINE GENERATOR TAB VIEW */}
          {activeTab === 'commands' && (
            <div className="col-span-12 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Form configuration controls */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
                  <div>
                    <h3 className="font-bold text-white text-md flex items-center gap-2">
                      <Settings className="w-4.5 h-4.5 text-emerald-400" />
                      Configure yt-dlp Settings
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Generate raw terminal arguments for standalone scripts or CLI commands:</p>
                  </div>

                  <div className="flex flex-col gap-4 text-xs">
                    
                    {/* Media URL */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Media URL:</label>
                      <input 
                        id="cli-url-input"
                        type="text" 
                        value={cliUrl}
                        onChange={(e) => setCliUrl(e.target.value)}
                        placeholder="https://www.youtube.com/..."
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* Mode (Format type) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Format Mode:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          id="cli-fmt-video"
                          onClick={() => setCliFormat('video')}
                          className={`py-2 rounded font-semibold border transition-all cursor-pointer ${
                            cliFormat === 'video' 
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Video + Audio
                        </button>
                        <button
                          id="cli-fmt-audio"
                          onClick={() => setCliFormat('audio')}
                          className={`py-2 rounded font-semibold border transition-all cursor-pointer ${
                            cliFormat === 'audio' 
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Audio Extraction Only
                        </button>
                      </div>
                    </div>

                    {/* Quality restriction (if video) */}
                    {cliFormat === 'video' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Max Resolution Constraint:</label>
                        <select
                          id="cli-res-select"
                          value={cliRes}
                          onChange={(e) => setCliRes(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
                        >
                          <option value="2160">2160p (4K UHD)</option>
                          <option value="1080">1080p (Full HD)</option>
                          <option value="720">720p (HD)</option>
                          <option value="480">480p (Standard)</option>
                        </select>
                      </div>
                    )}

                    {/* Checkbox settings */}
                    <div className="flex flex-col gap-3 mt-1 bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extra Post-Processors</span>
                      
                      <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
                        <input 
                          id="cli-chk-subs"
                          type="checkbox" 
                          checked={cliSubtitles} 
                          onChange={(e) => setCliSubtitles(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-800 text-emerald-500 bg-slate-950 accent-emerald-500 focus:ring-0" 
                        />
                        <span>Download & Embed Subtitles (English/Spanish)</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
                        <input 
                          id="cli-chk-thumbnail"
                          type="checkbox" 
                          checked={cliThumbnail} 
                          onChange={(e) => setCliThumbnail(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-800 text-emerald-500 bg-slate-950 accent-emerald-500 focus:ring-0" 
                        />
                        <span>Extract & Embed Thumbnail Artwork</span>
                      </label>
                    </div>

                  </div>
                </div>

                {/* Live CLI Output Terminal */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-white text-md">Generated Shell Script</h3>
                      <p className="text-xs text-slate-400 mt-1">Copy and paste this script directly into your Terminal, PowerShell, or command prompt:</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">Terminal Command</span>
                        <button 
                          id="copy-cli-btn"
                          onClick={handleCopyCli}
                          className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Command
                        </button>
                      </div>
                      <div className="p-4 font-mono text-xs text-emerald-400 bg-slate-950 leading-relaxed select-all min-h-[140px] break-all">
                        {generatedCliCommand}
                      </div>
                    </div>

                    {/* Pro Tips */}
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-2">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        Understanding the Command Arguments
                      </h4>
                      
                      <ul className="text-xs text-slate-400 flex flex-col gap-2.5 list-disc pl-4 leading-relaxed mt-1">
                        <li>
                          <strong className="text-slate-300 font-mono font-normal bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded">-f &quot;bestvideo+bestaudio...&quot;</strong> : Directs yt-dlp to obtain the highest isolated video frame rate and highest separate audio frequency and merge them together.
                        </li>
                        <li>
                          <strong className="text-slate-300 font-mono font-normal bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded">--merge-output-format mp4</strong> : Invokes the FFmpeg subsystem to merge formats cleanly into an mp4 shell container.
                        </li>
                        <li>
                          <strong className="text-slate-300 font-mono font-normal bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded">-o &quot;%(title)s.%(ext)s&quot;</strong> : Automated output templates which dynamically name the media file according to the parsed online title metadata.
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SETUP & TROUBLESHOOTING GUIDE TAB VIEW */}
          {activeTab === 'setup' && (
            <div className="col-span-12 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Step-by-Step implementation tutorial */}
                <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="font-bold text-white text-lg">System Prerequisites & Launch Guide</h3>
                    <p className="text-xs text-slate-400 mt-1">Follow these steps carefully to set up your python development environment and launch the CustomTkinter UI applet:</p>
                  </div>

                  <div className="flex flex-col gap-6">
                    
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                        1
                      </div>
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-white text-sm mb-1">Verify Python & Install PIP Packages</h4>
                        <p className="text-slate-400 leading-relaxed mb-3">Ensure Python (v3.9 or newer) is installed and available on your command shell path. Next, install CustomTkinter and yt-dlp core using the PIP installer:</p>
                        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-emerald-400 flex items-center justify-between select-all">
                          <span>pip install customtkinter yt-dlp</span>
                          <button 
                            id="copy-pip-cmd"
                            onClick={() => {
                              navigator.clipboard.writeText("pip install customtkinter yt-dlp");
                              showToast("Copied pip install command to clipboard!");
                            }}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 border-t border-slate-800/80 pt-6">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                        2
                      </div>
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                          Install FFmpeg System Dependency
                          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded uppercase font-semibold">Critical</span>
                        </h4>
                        <p className="text-slate-400 leading-relaxed mb-3">
                          To successfully stitch high-resolution visual tracks (like 1080p, 4K) with separate audio streams, or to process live HLS playlists, <strong>FFmpeg</strong> is required on your system PATH.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded">
                            <span className="font-bold text-slate-200 block mb-1">macOS (Homebrew)</span>
                            <code className="text-emerald-400 block font-mono text-[10px] mt-1 select-all bg-slate-950 px-1 py-0.5 rounded">brew install ffmpeg</code>
                          </div>
                          
                          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded">
                            <span className="font-bold text-slate-200 block mb-1">Windows (Chocolatey)</span>
                            <code className="text-emerald-400 block font-mono text-[10px] mt-1 select-all bg-slate-950 px-1 py-0.5 rounded">choco install ffmpeg</code>
                          </div>

                          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded">
                            <span className="font-bold text-slate-200 block mb-1">Linux (APT)</span>
                            <code className="text-emerald-400 block font-mono text-[10px] mt-1 select-all bg-slate-950 px-1 py-0.5 rounded">sudo apt install ffmpeg</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 border-t border-slate-800/80 pt-6">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                        3
                      </div>
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-white text-sm mb-1">Launch Downloader Application</h4>
                        <p className="text-slate-400 leading-relaxed mb-3">Save the compiled python script inside your working directory as <code className="text-emerald-400 font-mono">downloader.py</code> and execute using the shell terminal:</p>
                        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-emerald-400 flex items-center justify-between select-all">
                          <span>python downloader.py</span>
                          <button 
                            id="copy-run-cmd"
                            onClick={() => {
                              navigator.clipboard.writeText("python downloader.py");
                              showToast("Copied python launch command to clipboard!");
                            }}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Column: Troubleshooting FAQS & DRM Warnings */}
                <div className="md:col-span-4 flex flex-col gap-6">
                  
                  {/* FAQs */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-white text-md">FAQ & Troubleshooting</h3>
                    
                    <div className="flex flex-col gap-3 text-xs leading-relaxed">
                      
                      <div className="border-b border-slate-800/80 pb-3">
                        <strong className="text-slate-200 block mb-1">Why do I get &quot;Unsupported URL&quot; errors?</strong>
                        <span className="text-slate-400 block">Ensure that `yt-dlp` is fully updated. Major streaming platforms frequently update their API layouts. Run <code className="text-emerald-400 font-mono">pip install -U yt-dlp</code> in your console to apply the newest updates.</span>
                      </div>

                      <div className="border-b border-slate-800/80 pb-3">
                        <strong className="text-slate-200 block mb-1">Can I download private playlists?</strong>
                        <span className="text-slate-400 block">Yes. Add your account credentials or export and pass standard netscape cookie formats to the Options dictionary inside the Python script: <code className="text-emerald-400 font-mono">&apos;cookiefile&apos;: &apos;cookies.txt&apos;</code>.</span>
                      </div>

                      <div>
                        <strong className="text-slate-200 block mb-1">Why are audio tracks missing?</strong>
                        <span className="text-slate-400 block">High quality streams keep audio and video isolated. If `ffmpeg` is missing on your path, yt-dlp cannot stitch them, resulting in video-only tracks. Install FFmpeg to enable auto-merges.</span>
                      </div>

                    </div>
                  </div>

                  {/* Policy Warnings */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-white text-sm">DRM Content Safety Notice</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This application implements robust safety controls regarding copy-protected DRM files. Domains utilizing secure streaming tokens (such as Widevine on Netflix, Hulu, Prime Video) are bypassed and ignored. Only public, standard, non-encrypted streaming streams can be parsed.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* Elegant minimalist footer */}
      <footer className="border-t border-slate-800 py-6 mt-12 bg-slate-950 px-6">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span>Universal Python Video Downloader • Visual Playground v1.0.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> Powered by yt-dlp API</span>
            <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5 text-blue-400" /> CustomTkinter UI Wrapper</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
