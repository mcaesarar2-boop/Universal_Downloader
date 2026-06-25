import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Play, 
  Check, 
  Copy, 
  Terminal, 
  Settings, 
  Layers, 
  AlertTriangle, 
  Cpu, 
  Video, 
  Globe, 
  HelpCircle, 
  RefreshCw, 
  FileCode, 
  Laptop, 
  CheckCircle, 
  Info,
  Code,
  FileText
} from 'lucide-react';

// Live CustomTkinter code that gets updated dynamically based on user choices
const generatePythonCode = (accentColor: string) => {
  const mappedAccent = accentColor === 'dark-blue' ? 'dark-blue' : accentColor;
  return `"""
Universal Video Downloader GUI
==============================
A modern GUI desktop application using CustomTkinter, yt-dlp, requests, and FFmpeg.
Features multi-threaded format fetching, custom filenames, dynamic subtitle downloading,
and automatic audio/video/subtitle muxing with FFmpeg.

Requirements:
    pip install customtkinter yt-dlp requests

Note:
    FFmpeg must be installed and on your system PATH to merge video formats and
    soft-embed subtitles into the final media container (.mp4 or .mkv).
"""

import os
import sys
import shutil
import threading
import subprocess
import requests
import tkinter as tk
from tkinter import messagebox
import customtkinter as ctk
import yt_dlp

# Set modern look and dark theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("${mappedAccent}")

class UniversalVideoDownloader(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Window configuration
        self.title("Universal Video Downloader")
        self.geometry("640x650")
        self.resizable(False, False)
        
        # State variables
        self.is_fetching = False
        self.is_downloading = False
        self.is_verifying_subtitle = False
        self.fetched_formats_info = []
        self.video_title = ""
        
        # Main layout frame
        self.main_frame = ctk.CTkFrame(self, corner_radius=15)
        self.main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # App Title Label
        self.title_lbl = ctk.CTkLabel(
            self.main_frame,
            text="Universal Video Downloader",
            font=ctk.CTkFont(size=22, weight="bold")
        )
        self.title_lbl.pack(pady=(20, 15))
        
        # 1. Video URL Input Area
        self.url_label = ctk.CTkLabel(
            self.main_frame,
            text="Video / Stream / HLS URL:",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.url_label.pack(anchor="w", padx=30, pady=(5, 2))
        
        self.video_url_entry = ctk.CTkEntry(
            self.main_frame,
            placeholder_text="Enter video or HLS playlist URL (e.g., https://...)",
            width=500
        )
        self.video_url_entry.pack(padx=30, pady=(0, 10))
        
        # 2. Fetch Button
        self.fetch_button = ctk.CTkButton(
            self.main_frame,
            text="Fetch Video Formats",
            command=self.start_fetch_formats,
            font=ctk.CTkFont(weight="bold"),
            width=200
        )
        self.fetch_button.pack(pady=5)
        
        # 3. Format Selector Dropdown (Initially Disabled)
        self.format_label = ctk.CTkLabel(
            self.main_frame,
            text="Select Quality Format:",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.format_label.pack(anchor="w", padx=30, pady=(10, 2))
        
        self.format_selector = ctk.CTkOptionMenu(
            self.main_frame,
            values=["Fetch formats to enable..."],
            width=500,
            state="disabled"
        )
        self.format_selector.pack(padx=30, pady=(0, 10))
        
        # 4. Subtitle URL Input Area (Optional)
        self.sub_label = ctk.CTkLabel(
            self.main_frame,
            text="Subtitle URL (Optional - handles dynamic PHP/vtt/srt):",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.sub_label.pack(anchor="w", padx=30, pady=(10, 2))
        
        # Horizontal frame for subtitle entry and fetch/verify button
        self.sub_input_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        self.sub_input_frame.pack(fill="x", padx=30, pady=(0, 2))
        
        self.subtitle_url_entry = ctk.CTkEntry(
            self.sub_input_frame,
            placeholder_text="e.g., http://example.com/subtitle.php?pid=123 or standard VTT/SRT URL",
            width=360
        )
        self.subtitle_url_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        
        self.verify_sub_button = ctk.CTkButton(
            self.sub_input_frame,
            text="Verify Subtitle",
            command=self.start_verify_subtitle,
            font=ctk.CTkFont(size=11, weight="bold"),
            width=120
        )
        self.verify_sub_button.pack(side="right")
        
        # Subtitle verification status label
        self.subtitle_status_label = ctk.CTkLabel(
            self.main_frame,
            text="Status: Not verified (optional)",
            font=ctk.CTkFont(size=11, slant="italic"),
            text_color="#a3a3a3"
        )
        self.subtitle_status_label.pack(anchor="w", padx=30, pady=(0, 4))
        
        # Subtitle Processing Mode label & Segmented Button
        self.sub_mode_label = ctk.CTkLabel(
            self.main_frame,
            text="Subtitle Processing Mode:",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.sub_mode_label.pack(anchor="w", padx=30, pady=(4, 2))
        
        self.sub_mode_selector = ctk.CTkSegmentedButton(
            self.main_frame,
            values=["Softsub (Fast Remux to .mkv)", "Hardsub (Burn-in Re-encode to .mp4)"],
            width=500
        )
        self.sub_mode_selector.pack(padx=30, pady=(0, 10))
        self.sub_mode_selector.set("Softsub (Fast Remux to .mkv)")
        
        # 5. Custom Filename Input Area (Optional)
        self.filename_label = ctk.CTkLabel(
            self.main_frame,
            text="Custom Filename (Optional):",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.filename_label.pack(anchor="w", padx=30, pady=(10, 2))
        
        self.custom_filename_entry = ctk.CTkEntry(
            self.main_frame,
            placeholder_text="Leave blank to use the video's original title",
            width=500
        )
        self.custom_filename_entry.pack(padx=30, pady=(0, 15))
        
        # 6. Download Button
        self.download_button = ctk.CTkButton(
            self.main_frame,
            text="Download",
            command=self.start_download,
            font=ctk.CTkFont(size=14, weight="bold"),
            width=250,
            height=35,
            fg_color="#1f538d",
            hover_color="#14375e"
        )
        self.download_button.pack(pady=(5, 10))
        
        # 7. Progress UI Components
        self.progress_bar = ctk.CTkProgressBar(self.main_frame, width=500)
        self.progress_bar.pack(padx=30, pady=(5, 5))
        self.progress_bar.set(0)
        
        self.status_label = ctk.CTkLabel(
            self.main_frame,
            text="Ready. Enter a video URL and click 'Fetch Video Formats'.",
            font=ctk.CTkFont(size=11),
            text_color="#a3a3a3",
            wraplength=520
        )
        self.status_label.pack(padx=30, pady=(0, 15))

    # Safe helpers to update UI states from background threads
    def update_status(self, text, color="#a3a3a3"):
        self.status_label.configure(text=text, text_color=color)

    def set_progress(self, val):
        self.progress_bar.set(val)

    # ==================== PHASE 1: Fetching Formats ====================
    def start_fetch_formats(self):
        url = self.video_url_entry.get().strip()
        if not url:
            messagebox.showerror("Error", "Please enter a valid video URL first!")
            return
            
        if self.is_fetching or self.is_downloading:
            return
            
        self.is_fetching = True
        self.fetch_button.configure(state="disabled", text="Fetching info...")
        self.update_status("Querying video details from server... Please wait.")
        
        # Spin up daemon thread to prevent freezing the main UI
        thread = threading.Thread(target=self._fetch_formats_worker, args=(url,), daemon=True)
        thread.start()

    def _fetch_formats_worker(self, url):
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                self.video_title = info.get('title', 'video')
                formats = info.get('formats', [])
                
                # Parse unique visual heights and their containers
                seen_resolutions = set()
                parsed_formats = []
                
                for f in formats:
                    height = f.get('height')
                    ext = f.get('ext') or 'mp4'
                    # Prioritize formats with actual height dimensions
                    if height and height not in seen_resolutions:
                        seen_resolutions.add(height)
                        parsed_formats.append({
                            'label': f"{height}p - {ext}",
                            'height': height,
                            'ext': ext
                        })
                
                # Sort descending by resolution height
                parsed_formats.sort(key=lambda x: x['height'], reverse=True)
                
                # Update UI elements
                self.after(0, lambda: self._on_fetch_success(parsed_formats))
                
        except Exception as e:
            self.after(0, lambda: self._on_fetch_failed(str(e)))

    def _on_fetch_success(self, parsed_formats):
        self.is_fetching = False
        self.fetch_button.configure(state="normal", text="Fetch Video Formats")
        
        # Create dropdown items list
        dropdown_options = [f['label'] for f in parsed_formats]
        dropdown_options.append("Best (Default)")
        
        # Populate selector and enable
        self.format_selector.configure(values=dropdown_options, state="normal")
        self.format_selector.set(dropdown_options[0])
        
        self.update_status(f"Parsed {len(parsed_formats)} formats. Video Title: '{self.video_title}'", "#4ade80")

    def _on_fetch_failed(self, error_msg):
        self.is_fetching = False
        self.fetch_button.configure(state="normal", text="Fetch Video Formats")
        self.format_selector.configure(values=["Fetch formats to enable..."], state="disabled")
        self.format_selector.set("Fetch formats to enable...")
        self.update_status(f"Error fetching formats: {error_msg}", "#f87171")
        messagebox.showerror("Format Extraction Failed", f"Failed to retrieve format details:\\n{error_msg}")

    # ==================== SUBTITLE VERIFICATION ====================
    def start_verify_subtitle(self):
        url = self.subtitle_url_entry.get().strip()
        if not url:
            messagebox.showerror("Error", "Please enter a subtitle URL first!")
            return
            
        if self.is_verifying_subtitle:
            return
            
        self.is_verifying_subtitle = True
        self.verify_sub_button.configure(state="disabled", text="Verifying...")
        self.subtitle_status_label.configure(text="Fetching & validating subtitle...", text_color="#60a5fa")
        
        # Run background thread
        thread = threading.Thread(target=self._verify_subtitle_worker, args=(url,), daemon=True)
        thread.start()

    def _verify_subtitle_worker(self, url):
        temp_subs_path = os.path.abspath("temp_subs.vtt")
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            response = requests.get(url, headers=headers, timeout=15)
            
            if response.status_code != 200:
                raise ValueError(f"HTTP Error {response.status_code}")
                
            content = response.text
            stripped_content = content.lstrip()
            
            # Validation check
            is_valid = stripped_content.startswith("WEBVTT") or "-->" in stripped_content
            
            if is_valid:
                # Save content immediately as temp_subs.vtt
                with open(temp_subs_path, "w", encoding="utf-8") as sub_file:
                    sub_file.write(content)
                self.after(0, lambda: self._on_verify_subtitle_success())
            else:
                # Delete any leftover temp_subs.vtt
                if os.path.exists(temp_subs_path):
                    try:
                        os.remove(temp_subs_path)
                    except:
                        pass
                self.after(0, lambda: self._on_verify_subtitle_failed("Invalid subtitle format (not VTT/SRT)"))
                
        except Exception as e:
            # Delete any leftover temp_subs.vtt on error
            if os.path.exists(temp_subs_path):
                try:
                    os.remove(temp_subs_path)
                except:
                    pass
            self.after(0, lambda: self._on_verify_subtitle_failed(str(e)))

    def _on_verify_subtitle_success(self):
        self.is_verifying_subtitle = False
        self.verify_sub_button.configure(state="normal", text="Verify Subtitle")
        self.subtitle_status_label.configure(text="✅ Subtitle Fetched & Validated!", text_color="#4ade80")

    def _on_verify_subtitle_failed(self, error_msg):
        self.is_verifying_subtitle = False
        self.verify_sub_button.configure(state="normal", text="Verify Subtitle")
        self.subtitle_status_label.configure(text="❌ Error: Invalid Subtitle Link or Format", text_color="#f87171")

    # ==================== PHASE 2: Downloading & Merging ====================
    def start_download(self):
        url = self.video_url_entry.get().strip()
        if not url:
            messagebox.showerror("Error", "Please enter a valid video URL first!")
            return
            
        # Check if FFmpeg is installed and accessible
        if not shutil.which('ffmpeg'):
            self.update_status("Error: FFmpeg is not installed or not in PATH.", "#f87171")
            messagebox.showerror(
                "FFmpeg Missing", 
                "FFmpeg is not installed or not found on the system PATH.\\n\\n"
                "To download high-quality streams and merge subtitles, FFmpeg is required.\\n"
                "Please install FFmpeg and ensure it is added to your environment variables."
            )
            return

        if self.is_downloading or self.is_fetching:
            return
            
        self.is_downloading = True
        self.download_button.configure(state="disabled", text="Downloading...")
        self.set_progress(0)
        self.update_status("Initializing download pipeline...")
        
        # Get subtitle mode from selector
        sub_mode = self.sub_mode_selector.get()
        
        # Spin up daemon thread to prevent freezing the main UI
        thread = threading.Thread(target=self._download_worker, args=(url, sub_mode), daemon=True)
        thread.start()

    def _download_worker(self, url, sub_mode):
        selected_fmt = self.format_selector.get()
        subtitle_url = self.subtitle_url_entry.get().strip()
        custom_name = self.custom_filename_entry.get().strip()
        
        # Setup output templates
        if custom_name:
            # Strip illegal characters for filenames
            clean_name = "".join([c for c in custom_name if c.isalpha() or c.isdigit() or c in ' ._-']).strip()
            if not clean_name:
                clean_name = "custom_video"
            out_template = f"{clean_name}.%(ext)s"
            final_display_name = clean_name
        else:
            out_template = "%(title)s.%(ext)s"
            final_display_name = self.video_title or "Downloaded Video"

        # Map selected dropdown resolution back to yt-dlp queries
        format_query = 'bestvideo+bestaudio/best'
        if selected_fmt != "Best (Default)" and "p" in selected_fmt:
            try:
                res = selected_fmt.split("p")[0].strip()
                format_query = f"bestvideo[height<={res}]+bestaudio/best[height<={res}]"
            except:
                pass

        # Progress hooks for live progress bar
        def progress_hook(d):
            if d['status'] == 'downloading':
                total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes', 0)
                speed = d.get('speed', 0)
                eta = d.get('eta', 0)
                
                pct = (downloaded / total) if total > 0 else 0
                pct_percentage = pct * 100
                
                speed_str = "0 KB/s"
                if speed:
                    if speed > 1024 * 1024:
                        speed_str = f"{speed / (1024 * 1024):.1f} MB/s"
                    else:
                        speed_str = f"{speed / 1024:.0f} KB/s"
                        
                eta_str = "--:--"
                if eta:
                    m, s = divmod(int(eta), 60)
                    eta_str = f"{m:02d}:{s:02d}"
                    
                status_text = f"Downloading: {pct_percentage:.1f}% | Speed: {speed_str} | ETA: {eta_str}"
                self.after(0, lambda: self.set_progress(pct))
                self.after(0, lambda: self.update_status(status_text, "#60a5fa"))
                
            elif d['status'] == 'finished':
                self.after(0, lambda: self.update_status("Video download complete. Merging streams..."))

        ydl_opts = {
            'format': format_query,
            'outtmpl': out_template,
            'merge_output_format': 'mp4',  # Standard merging format
            'progress_hooks': [progress_hook],
            'quiet': True,
            'no_warnings': True
        }

        # Handle condition boundaries
        temp_subs_path = os.path.abspath("temp_subs.vtt")
        has_subtitle = False

        try:
            # 1. First download the video using yt-dlp (Common to both A and B)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(url, download=True)
                
                # --- Dynamic File Tracking ---
                final_video_path = None
                
                # Attempt 1: get from requested_downloads list
                requested_downloads = info_dict.get('requested_downloads', [])
                if requested_downloads and isinstance(requested_downloads, list):
                    first_dl = requested_downloads[0]
                    if isinstance(first_dl, dict) and first_dl.get('filepath'):
                        candidate = first_dl['filepath']
                        if os.path.exists(candidate):
                            final_video_path = os.path.abspath(candidate)
                
                # Attempt 2: get from '_filename' key
                if not final_video_path:
                    candidate = info_dict.get('_filename')
                    if candidate and os.path.exists(candidate):
                        final_video_path = os.path.abspath(candidate)
                        
                # Attempt 3: get from prepare_filename
                if not final_video_path:
                    prepared_filename = ydl.prepare_filename(info_dict)
                    if os.path.exists(prepared_filename):
                        final_video_path = os.path.abspath(prepared_filename)
                    else:
                        # Sometimes yt-dlp automatically merges streams or converts formats, changing the extension.
                        # Let's check common media extensions with the same base name.
                        base, _ = os.path.splitext(prepared_filename)
                        for ext in ['.mp4', '.mkv', '.webm', '.flv', '.avi', '.ts']:
                            if os.path.exists(base + ext):
                                final_video_path = os.path.abspath(base + ext)
                                break

                # Attempt 4: Scan current directory for files starting with the base name
                if not final_video_path:
                    prepared_filename = ydl.prepare_filename(info_dict)
                    base_name = os.path.basename(os.path.splitext(prepared_filename)[0])
                    for f in os.listdir('.'):
                        if f.startswith(base_name) and f != "temp_subs.vtt":
                            final_video_path = os.path.abspath(f)
                            break
                
                # Raise descriptive exception if video is not found
                if not final_video_path or not os.path.exists(final_video_path):
                    raise FileNotFoundError("yt-dlp completed downloading, but the final video file could not be located on disk.")

            # 2. Subtitle Processing & Remuxing
            has_subtitle = os.path.exists(temp_subs_path)
            
            # If temp_subs.vtt doesn't exist yet but the user filled in the subtitle URL field, fetch it now
            if not has_subtitle and subtitle_url:
                self.after(0, lambda: self.update_status("Fetching subtitle track from URL..."))
                
                # Download subtitle content via requests
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                response = requests.get(subtitle_url, headers=headers, timeout=15)
                response.raise_for_status()
                sub_content = response.text
                
                # Save raw content locally as temp_subs.vtt
                with open(temp_subs_path, "w", encoding="utf-8") as sub_file:
                    sub_file.write(sub_content)
                has_subtitle = True
                
            if has_subtitle:
                # Mux or burn-in subtitles depending on the selected mode
                name_no_ext, _ = os.path.splitext(final_video_path)
                is_hardsub = "Hardsub" in sub_mode
                
                if is_hardsub:
                    self.after(0, lambda: self.update_status("Re-encoding video with hardsubs (Burn-in)..."))
                    output_video_path = f"{name_no_ext}_hardsubbed.mp4"
                    cmd = [
                        'ffmpeg', '-y',
                        '-i', final_video_path,
                        '-vf', f"subtitles={temp_subs_path}",
                        '-c:v', 'libx264',
                        '-preset', 'fast',
                        '-crf', '23',
                        '-c:a', 'copy',
                        output_video_path
                    ]
                else:
                    self.after(0, lambda: self.update_status("Remuxing video & subtitle with FFmpeg..."))
                    output_video_path = f"{name_no_ext}_muxed.mkv"
                    cmd = [
                        'ffmpeg', '-y',
                        '-i', final_video_path,
                        '-i', temp_subs_path,
                        '-c', 'copy',
                        '-map', '0',
                        '-map', '1',
                        '-disposition:s:0', 'default',
                        output_video_path
                    ]
                
                # Execute FFmpeg subprocess safely using absolute file paths
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                
                if os.path.exists(output_video_path):
                    # Remove original raw input video file
                    if os.path.exists(final_video_path) and final_video_path != output_video_path:
                        try:
                            os.remove(final_video_path)
                        except Exception as e:
                            print(f"Error removing raw input video: {e}")
                    
                    # Remove original raw input subtitle file (temp_subs.vtt)
                    if os.path.exists(temp_subs_path):
                        try:
                            os.remove(temp_subs_path)
                        except Exception as e:
                            print(f"Error removing raw input subtitle: {e}")
                            
                    final_video_path = output_video_path
                    msg = "Subtitle track hardsubbed successfully." if is_hardsub else "Subtitle track remuxed successfully."
                    self.after(0, lambda: self.update_status(msg, "#4ade80"))
                else:
                    raise Exception("FFmpeg execution finished, but the output file was not generated.")

            self.after(0, lambda: self._on_download_success(final_video_path))
            
        except Exception as e:
            self.after(0, lambda: self._on_download_failed(str(e)))
            
        finally:
            # Clean up (delete) the temp_subs.vtt file if it exists
            if os.path.exists(temp_subs_path):
                try:
                    os.remove(temp_subs_path)
                except Exception as clean_err:
                    print(f"Error cleaning up temp subtitle file: {clean_err}")

    def _on_download_success(self, filepath):
        self.is_downloading = False
        self.download_button.configure(state="normal", text="Download")
        self.set_progress(1.0)
        self.update_status(f"Download complete! Saved as '{os.path.basename(filepath)}'", "#4ade80")
        messagebox.showinfo("Success", f"Video download and pipeline process completed successfully!\\nSaved to: {os.path.abspath(filepath)}")

    def _on_download_failed(self, error_msg):
        self.is_downloading = False
        self.download_button.configure(state="normal", text="Download")
        self.update_status(f"Error: {error_msg}", "#f87171")
        messagebox.showerror("Download Failed", f"An error occurred during download or post-processing:\\n{error_msg}")

if __name__ == "__main__":
    app = UniversalVideoDownloader()
    app.mainloop()
`;
};

// Preset definition for our interactive simulator
interface VideoPreset {
  name: string;
  url: string;
  subtitleUrl: string;
  title: string;
  duration: string;
  provider: string;
  formats: string[];
  description: string;
}

const PRESETS: VideoPreset[] = [
  {
    name: 'YouTube Standard (Condition A - Video Only)',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    subtitleUrl: '', // EMPTY -> Condition A
    title: 'How Rockets Work - SpaceX Flight Mechanics 101',
    duration: '05:42',
    provider: 'YouTube',
    formats: ['1080p - mp4', '720p - mp4', '480p - mp4', 'Best (Default)'],
    description: 'Models a standard YouTube video download with no external subtitle file. Saves as a clean .mp4 file.'
  },
  {
    name: 'Vimeo Cinematic (Condition B - Video + Subtitle)',
    url: 'https://vimeo.com/894732104',
    subtitleUrl: 'https://cinemacaptions.api/subtitles.php?id=drone_seq_en', // FILLED -> Condition B
    title: 'Over the Glacier - Cinematic drone sequence of Svalbard',
    duration: '02:08',
    provider: 'Vimeo',
    formats: ['2160p - mkv', '1080p - mp4', '720p - mp4', 'Best (Default)'],
    description: 'Models custom subtitle integration. Downloads a .mp4 video, fetches WebVTT subtitling text from a dynamic PHP endpoint, muxes them into a single soft-embedded subtitle .mkv package via FFmpeg, and deletes the temporary files.'
  },
  {
    name: 'HLS news feed stream (Condition A - Video Only)',
    url: 'https://streaming.service.example/live/news_feed.m3u8',
    subtitleUrl: '',
    title: 'Global Live News Feed - Broadcast Manifest',
    duration: 'Live Stream',
    provider: 'HLS / m3u8',
    formats: ['1080p - m3u8', '720p - m3u8', 'Best (Default)'],
    description: 'Models downloading a live HLS segment stream. Saves as a continuous segment without sub-tracks.'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'emulator' | 'code' | 'setup'>('emulator');
  
  // Customization state that updates Python code live
  const [accentColor, setAccentColor] = useState<string>('blue');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Elegant floating notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Simulator specific state (mapping exactly to CustomTkinter components)
  const [simulatorUrl, setSimulatorUrl] = useState<string>('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  const [isFetchingSim, setIsFetchingSim] = useState<boolean>(false);
  const [fetchedMetadataSim, setFetchedMetadataSim] = useState<VideoPreset | null>(null);
  const [selectedFormatSim, setSelectedFormatSim] = useState<string>('Fetch formats to enable...');
  const [isFormatMenuEnabled, setIsFormatMenuEnabled] = useState<boolean>(false);
  
  const [subtitleUrlSim, setSubtitleUrlSim] = useState<string>('');
  const [isVerifyingSubSim, setIsVerifyingSubSim] = useState<boolean>(false);
  const [subtitleStatusLabelSim, setSubtitleStatusLabelSim] = useState<string>("Status: Not verified (optional)");
  const [subtitleStatusColorSim, setSubtitleStatusColorSim] = useState<string>("text-slate-400");
  const [isSubtitleVerifiedSim, setIsSubtitleVerifiedSim] = useState<boolean>(false);
  const [subModeSim, setSubModeSim] = useState<string>("Softsub (Fast Remux to .mkv)");
  const [customFilenameSim, setCustomFilenameSim] = useState<string>('');
  const [isDownloadingSim, setIsDownloadingSim] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simStatusLabel, setSimStatusLabel] = useState<string>("Ready. Enter a video URL and click 'Fetch Video Formats'.");
  const [simStatusColor, setSimStatusColor] = useState<string>("text-slate-400");
  
  // Terminal diagnostics log streams
  const [simLogs, setSimLogs] = useState<string[]>([
    '[system] UniversalVideoDownloader class initialized.',
    '[system] Python 3.11 wrapper ready. CustomTkinter UI framework loaded.',
    '[system] yt-dlp core detected (v2026.03.10).'
  ]);

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simLogs]);

  // Handler to copy code block
  const handleCopyCode = () => {
    const code = generatePythonCode(accentColor);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast("Successfully copied downloader.py script to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper to trigger direct python script download
  const handleDownloadPyScript = () => {
    const code = generatePythonCode(accentColor);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'downloader.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded downloader.py file directly to your disk!");
  };

  // Quick select preset
  const handleSelectPreset = (preset: VideoPreset) => {
    setSimulatorUrl(preset.url);
    setSubtitleUrlSim(preset.subtitleUrl);
    // Clear out fetched state so user can experience "Fetch" step
    setFetchedMetadataSim(null);
    setIsFormatMenuEnabled(false);
    setSelectedFormatSim('Fetch formats to enable...');
    setSimProgress(0);
    setSimStatusLabel("Preset loaded! Click 'Fetch Video Formats' to query available formats.");
    setSimStatusColor("text-sky-400");
    setIsSubtitleVerifiedSim(false);
    setSubtitleStatusLabelSim("Status: Not verified (optional)");
    setSubtitleStatusColorSim("text-slate-400");
    setSubModeSim("Softsub (Fast Remux to .mkv)");
    addLog(`[UI] Pasted preset: ${preset.name}`);
  };

  // Add a log line to simulated console
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSimLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Simulated verification handler
  const handleSimVerifySubtitle = () => {
    if (!subtitleUrlSim.trim()) {
      addLog('ERROR: Subtitle URL input is empty!');
      setSubtitleStatusLabelSim("❌ Error: Subtitle URL cannot be empty");
      setSubtitleStatusColorSim("text-red-400");
      return;
    }

    setIsVerifyingSubSim(true);
    setSubtitleStatusLabelSim("Fetching & validating subtitle...");
    setSubtitleStatusColorSim("text-blue-400");
    addLog(`[thread-3] Spawning subtitle verification thread...`);
    addLog(`[thread-3] Fetching subtitle from URL: "${subtitleUrlSim}"`);

    setTimeout(() => {
      const lowerUrl = subtitleUrlSim.toLowerCase();
      const isValid = lowerUrl.includes('vtt') || lowerUrl.includes('srt') || lowerUrl.includes('php') || lowerUrl.includes('sub');

      if (isValid) {
        setIsSubtitleVerifiedSim(true);
        setSubtitleStatusLabelSim("✅ Subtitle Fetched & Validated!");
        setSubtitleStatusColorSim("text-green-400");
        addLog(`[thread-3] Validation Check: Status Code 200, WEBVTT and arrow timecode check passed.`);
        addLog(`[thread-3] Saved validated subtitle locally as "temp_subs.vtt"`);
        addLog(`[thread-3] Verification successful.`);
      } else {
        setIsSubtitleVerifiedSim(false);
        setSubtitleStatusLabelSim("❌ Error: Invalid Subtitle Link or Format");
        setSubtitleStatusColorSim("text-red-400");
        addLog(`[thread-3] ERROR: Verification failed. Invalid content format or network error.`);
      }
      setIsVerifyingSubSim(false);
    }, 1200);
  };

  // Run simulated fetch metadata info (Phase 1)
  const handleSimFetchInfo = () => {
    if (!simulatorUrl.trim()) {
      addLog('ERROR: Video URL input is empty!');
      setSimStatusLabel("Error: Enter a valid video URL first!");
      setSimStatusColor("text-red-400");
      return;
    }

    setIsFetchingSim(true);
    setFetchedMetadataSim(null);
    setIsFormatMenuEnabled(false);
    setSelectedFormatSim('Fetching info...');
    setSimStatusLabel("Querying video details from server... Please wait.");
    setSimStatusColor("text-slate-400");
    
    addLog(`[thread-1] Spawning fetch worker thread...`);
    addLog(`[thread-1] Executing: yt-dlp --extract-info --download-false "${simulatorUrl}"`);

    // Simulate network delay
    setTimeout(() => {
      // Find matching preset, else use a generic mock info
      const foundPreset = PRESETS.find(p => simulatorUrl.toLowerCase().includes(p.provider.toLowerCase()) || simulatorUrl.toLowerCase().includes(p.url.split('watch?v=')[1]?.slice(0, 4))) || {
        name: 'Custom User Stream',
        url: simulatorUrl,
        subtitleUrl: subtitleUrlSim,
        title: simulatorUrl.includes('youtube') ? 'A Custom Youtube Video' : 'Generic Web Stream Container',
        duration: '04:15',
        provider: 'Generic Extractor',
        formats: ['1080p - mp4', '720p - mp4', '480p - mp4', 'Best (Default)'],
        description: 'Dynamic custom input.'
      };

      setFetchedMetadataSim(foundPreset);
      setIsFormatMenuEnabled(true);
      setSelectedFormatSim(foundPreset.formats[0]);
      setIsFetchingSim(false);
      
      setSimStatusLabel(`Parsed ${foundPreset.formats.length} formats. Video Title: '${foundPreset.title}'`);
      setSimStatusColor("text-green-400");
      
      addLog(`[thread-1] Title parsed successfully: "${foundPreset.title}"`);
      addLog(`[thread-1] Extractor provider: ${foundPreset.provider} | Duration: ${foundPreset.duration}`);
      addLog(`[thread-1] Worker completed. Populating CTkOptionMenu dropdown.`);
    }, 1500);
  };

  // Run simulated media download (Phase 2)
  const handleSimDownload = () => {
    if (!fetchedMetadataSim) {
      addLog('ERROR: Format dictionary not found. You must Fetch Video Formats first!');
      return;
    }
    
    setIsDownloadingSim(true);
    setSimProgress(0);
    setSimStatusLabel("Initializing download pipeline...");
    setSimStatusColor("text-blue-400");
    
    addLog(`[thread-2] Spawning downloader daemon thread...`);
    addLog(`[thread-2] Configured format selector query: ${selectedFormatSim}`);
    
    const finalName = customFilenameSim.trim() ? customFilenameSim.trim() : fetchedMetadataSim.title;
    if (customFilenameSim.trim()) {
      addLog(`[thread-2] Configuring custom filename option: ${customFilenameSim}`);
    }

    let progressValue = 0;
    const speedOptions = ['4.5 MB/s', '5.2 MB/s', '3.9 MB/s', '4.8 MB/s', '5.1 MB/s'];
    const hasSubtitleFilled = subtitleUrlSim.trim().length > 0;

    const interval = setInterval(() => {
      progressValue += Math.floor(Math.random() * 15) + 8;
      
      if (progressValue >= 100) {
        progressValue = 100;
        setSimProgress(1.0);
        clearInterval(interval);
        
        addLog(`[thread-2] Video track downloaded: 100.0% done.`);
        
        if (isSubtitleVerifiedSim) {
          // Pre-verified subtitle
          const isHardsub = subModeSim.includes("Hardsub");
          const tempVideoFile = `${finalName.toLowerCase().replace(/\s+/g, '_')}.mp4`;
          const finalMuxedFile = isHardsub 
            ? `${finalName.toLowerCase().replace(/\s+/g, '_')}_hardsubbed.mp4` 
            : `${finalName.toLowerCase().replace(/\s+/g, '_')}_muxed.mkv`;
          
          if (isHardsub) {
            setSimStatusLabel("Re-encoding video with hardsubs (Burn-in)...");
            setSimStatusColor("text-amber-400");
            addLog(`[thread-2] Found pre-verified "temp_subs.vtt" file. Skipping HTTP requests download step.`);
            addLog(`[thread-2] Invoking FFmpeg subprocess command...`);
            addLog(`[ffmpeg] Executing: ffmpeg -y -i ${tempVideoFile} -vf "subtitles=temp_subs.vtt" -c:v libx264 -preset fast -crf 23 -c:a copy ${finalMuxedFile}`);
          } else {
            setSimStatusLabel("Muxing video & subtitle with FFmpeg...");
            setSimStatusColor("text-amber-400");
            addLog(`[thread-2] Found pre-verified "temp_subs.vtt" file. Skipping HTTP requests download step.`);
            addLog(`[thread-2] Invoking FFmpeg subprocess command...`);
            addLog(`[ffmpeg] Executing: ffmpeg -y -i ${tempVideoFile} -i temp_subs.vtt -c copy -map 0 -map 1 -disposition:s:0 default ${finalMuxedFile}`);
          }
          
          setTimeout(() => {
            if (isHardsub) {
              addLog(`[ffmpeg] Hardsub re-encoding complete. Generated final package: "${finalMuxedFile}"`);
              addLog(`[thread-2] Removing temporary file: "temp_subs.vtt" removed.`);
              addLog(`[thread-2] Removing un-muxed raw video: "${tempVideoFile}" removed.`);
              
              setSimStatusLabel(`Download complete! Saved as '${finalMuxedFile}'`);
              setSimStatusColor("text-green-400");
              setIsDownloadingSim(false);
              addLog(`[system] SUCCESS: Download & hard-burn pipeline executed flawlessly.`);
              alert(`Success! Saved with hard-burned subtitles as: ${finalMuxedFile}`);
            } else {
              addLog(`[ffmpeg] Muxing complete. Generated final package: "${finalMuxedFile}"`);
              addLog(`[thread-2] Removing temporary file: "temp_subs.vtt" removed.`);
              addLog(`[thread-2] Removing un-muxed raw video: "${tempVideoFile}" removed.`);
              
              setSimStatusLabel(`Download complete! Saved as '${finalMuxedFile}'`);
              setSimStatusColor("text-green-400");
              setIsDownloadingSim(false);
              addLog(`[system] SUCCESS: Download & soft-embedding pipeline executed flawlessly.`);
              alert(`Success! Saved with embedded subtitles as: ${finalMuxedFile}`);
            }
          }, 1500);
          
        } else if (hasSubtitleFilled) {
          // Subtitle not verified, but URL filled (fetch dynamically as fallback)
          setSimStatusLabel("Fetching subtitle track from URL...");
          setSimStatusColor("text-amber-400");
          addLog(`[thread-2] Subtitle URL is FILLED: "${subtitleUrlSim}" but not pre-verified.`);
          addLog(`[thread-2] Initiating HTTP GET request via requests library...`);
          
          setTimeout(() => {
            addLog(`[thread-2] Subtitle GET request completed with HTTP 200 OK.`);
            addLog(`[thread-2] Saved temporary subtitle file locally as "temp_subs.vtt"`);
            
            const isHardsub = subModeSim.includes("Hardsub");
            const tempVideoFile = `${finalName.toLowerCase().replace(/\s+/g, '_')}.mp4`;
            const finalMuxedFile = isHardsub 
              ? `${finalName.toLowerCase().replace(/\s+/g, '_')}_hardsubbed.mp4` 
              : `${finalName.toLowerCase().replace(/\s+/g, '_')}_muxed.mkv`;
            
            if (isHardsub) {
              setSimStatusLabel("Re-encoding video with hardsubs (Burn-in)...");
              setSimStatusColor("text-amber-400");
              addLog(`[thread-2] Invoking FFmpeg subprocess command...`);
              addLog(`[ffmpeg] Executing: ffmpeg -y -i ${tempVideoFile} -vf "subtitles=temp_subs.vtt" -c:v libx264 -preset fast -crf 23 -c:a copy ${finalMuxedFile}`);
            } else {
              setSimStatusLabel("Muxing video & subtitle with FFmpeg...");
              setSimStatusColor("text-amber-400");
              addLog(`[thread-2] Invoking FFmpeg subprocess command...`);
              addLog(`[ffmpeg] Executing: ffmpeg -y -i ${tempVideoFile} -i temp_subs.vtt -c copy -map 0 -map 1 -disposition:s:0 default ${finalMuxedFile}`);
            }
            
            setTimeout(() => {
              if (isHardsub) {
                addLog(`[ffmpeg] Hardsub re-encoding complete. Generated final package: "${finalMuxedFile}"`);
                addLog(`[thread-2] Removing temporary file: "temp_subs.vtt" removed.`);
                addLog(`[thread-2] Removing un-muxed raw video: "${tempVideoFile}" removed.`);
                
                setSimStatusLabel(`Download complete! Saved as '${finalMuxedFile}'`);
                setSimStatusColor("text-green-400");
                setIsDownloadingSim(false);
                addLog(`[system] SUCCESS: Download & hard-burn pipeline executed flawlessly.`);
                alert(`Success! Saved with hard-burned subtitles as: ${finalMuxedFile}`);
              } else {
                addLog(`[ffmpeg] Muxing complete. Generated final package: "${finalMuxedFile}"`);
                addLog(`[thread-2] Removing temporary file: "temp_subs.vtt" removed.`);
                addLog(`[thread-2] Removing un-muxed raw video: "${tempVideoFile}" removed.`);
                
                setSimStatusLabel(`Download complete! Saved as '${finalMuxedFile}'`);
                setSimStatusColor("text-green-400");
                setIsDownloadingSim(false);
                addLog(`[system] SUCCESS: Download & soft-embedding pipeline executed flawlessly.`);
                alert(`Success! Saved with embedded subtitles as: ${finalMuxedFile}`);
              }
            }, 1500);
            
          }, 1000);
          
        } else {
          // Condition A: Video Only
          setSimStatusLabel("Video download complete. Merging streams...");
          addLog(`[thread-2] [Condition A] Subtitle URL is EMPTY. Skipping subtitle process.`);
          addLog(`[thread-2] yt-dlp merging audio and video tracks into unified container...`);
          
          setTimeout(() => {
            const finalVideoFile = `${finalName.toLowerCase().replace(/\s+/g, '_')}.mp4`;
            addLog(`[thread-2] Merged output generated: "${finalVideoFile}"`);
            setSimStatusLabel(`Download complete! Saved as '${finalVideoFile}'`);
            setSimStatusColor("text-green-400");
            setIsDownloadingSim(false);
            addLog(`[system] SUCCESS: Download pipeline executed flawlessly.`);
            alert(`Success! Video downloaded successfully as: ${finalVideoFile}`);
          }, 1200);
        }
        
      } else {
        const pct = progressValue / 100;
        setSimProgress(pct);
        const randomSpeed = speedOptions[Math.floor(Math.random() * speedOptions.length)];
        const remainingSeconds = Math.max(1, Math.round(((100 - progressValue) / 12)));
        const etaStr = `00:${remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds}`;
        
        setSimStatusLabel(`Downloading: ${progressValue.toFixed(0)}% | Speed: ${randomSpeed} | ETA: ${etaStr}`);
        setSimStatusColor("text-blue-400");
        addLog(`[thread-2] Progress: ${progressValue.toFixed(1)}% | Speed: ${randomSpeed} | ETA: ${etaStr}`);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Toast Alerts */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce font-medium text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Segment */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-5 shrink-0">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Download className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Universal Video Downloader Playground
                <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono uppercase font-normal">v1.2.0</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Interactive CustomTkinter GUI emulator, source builder, and FFmpeg multiplexer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="download-btn-header"
              onClick={handleDownloadPyScript}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              Get `downloader.py`
            </button>
            <a 
              href="https://github.com/yt-dlp/yt-dlp" 
              target="_blank" 
              rel="noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all"
            >
              yt-dlp Docs
              <Globe className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6 overflow-hidden">
        
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-800/80 gap-2 shrink-0">
          <button
            id="tab-emulator"
            onClick={() => setActiveTab('emulator')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'emulator' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Interactive GUI Emulator
          </button>
          
          <button
            id="tab-code"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'code' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Code className="w-4 h-4" />
            Python Source Code (`downloader.py`)
          </button>

          <button
            id="tab-setup"
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'setup' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Setup & Execution Guide
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-y-auto">

          {/* TAB 1: INTERACTIVE DESKTOP EMULATOR */}
          {activeTab === 'emulator' && (
            <>
              {/* Left Side: Mock CustomTkinter Window */}
              <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
                
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Live App Mockup Frame
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Simulated Multi-Threaded Process</span>
                </div>

                {/* Simulated CustomTkinter Desktop Window */}
                <div className="border border-slate-800 rounded-xl bg-slate-950 shadow-2xl flex flex-col overflow-hidden max-w-[640px] mx-auto w-full">
                  
                  {/* OS Titlebar */}
                  <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300 select-none">Universal Video Downloader</span>
                    <div className="w-12"></div>
                  </div>

                  {/* CustomTkinter App Content (Matching exactly the Python code layout!) */}
                  <div className="p-6 bg-slate-900/40 flex flex-col gap-4 text-slate-200">
                    
                    {/* App Title inside the CustomTkinter frame */}
                    <div className="text-center py-2 border-b border-slate-800/60">
                      <h2 className="text-xl font-bold tracking-tight text-white">Universal Video Downloader</h2>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Powered by CustomTkinter, yt-dlp & FFmpeg</span>
                    </div>

                    {/* 1. Video URL Input Area */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Video / Stream / HLS URL:</label>
                      <input 
                        id="sim-url-input"
                        type="text"
                        placeholder="Enter video or HLS playlist URL (e.g., https://...)"
                        value={simulatorUrl}
                        onChange={(e) => setSimulatorUrl(e.target.value)}
                        disabled={isDownloadingSim || isFetchingSim}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>

                    {/* 2. Fetch Video Formats Button */}
                    <div className="flex justify-center">
                      <button
                        id="sim-fetch-btn"
                        onClick={handleSimFetchInfo}
                        disabled={isFetchingSim || isDownloadingSim}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs py-2 px-6 rounded transition-colors duration-150 disabled:text-slate-500 cursor-pointer"
                      >
                        {isFetchingSim ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Fetching info...
                          </span>
                        ) : "Fetch Video Formats"}
                      </button>
                    </div>

                    {/* 3. Format Selector OptionMenu */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Select Quality Format:</label>
                      <select
                        id="sim-format-selector"
                        disabled={!isFormatMenuEnabled || isDownloadingSim}
                        value={selectedFormatSim}
                        onChange={(e) => setSelectedFormatSim(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2.5 py-1.5 font-medium focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        {!isFormatMenuEnabled ? (
                          <option>Fetch formats to enable...</option>
                        ) : (
                          fetchedMetadataSim?.formats.map((fmt, idx) => (
                            <option key={idx} value={fmt}>{fmt}</option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* 4. Subtitle URL Input Area */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Subtitle URL (Optional - handles dynamic PHP/vtt/srt):</label>
                      <div className="flex items-center gap-2">
                        <input 
                          id="sim-subtitle-input"
                          type="text"
                          placeholder="e.g., http://example.com/subtitle.php?pid=123 or standard VTT/SRT URL"
                          value={subtitleUrlSim}
                          onChange={(e) => {
                            setSubtitleUrlSim(e.target.value);
                            setIsSubtitleVerifiedSim(false);
                            setSubtitleStatusLabelSim("Status: Not verified (optional)");
                            setSubtitleStatusColorSim("text-slate-400");
                          }}
                          disabled={isDownloadingSim || isVerifyingSubSim}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 placeholder:text-slate-600"
                        />
                        <button
                          id="sim-verify-sub-btn"
                          onClick={handleSimVerifySubtitle}
                          disabled={isDownloadingSim || isVerifyingSubSim}
                          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded transition-colors duration-150 disabled:text-slate-500 cursor-pointer"
                        >
                          {isVerifyingSubSim ? "Verifying..." : "Verify Subtitle"}
                        </button>
                      </div>
                      <p className={`text-[11px] font-medium italic mt-0.5 ${subtitleStatusColorSim}`}>
                        {subtitleStatusLabelSim}
                      </p>
                    </div>

                    {/* Subtitle Processing Mode Segmented Button (Simulated CTkSegmentedButton) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300">Subtitle Processing Mode:</label>
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded">
                        <button
                          type="button"
                          id="sim-sub-mode-soft"
                          onClick={() => setSubModeSim("Softsub (Fast Remux to .mkv)")}
                          disabled={isDownloadingSim}
                          className={`text-[11px] font-bold py-1.5 px-2 rounded transition-all duration-150 cursor-pointer ${
                            subModeSim === "Softsub (Fast Remux to .mkv)"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Softsub (Fast Remux .mkv)
                        </button>
                        <button
                          type="button"
                          id="sim-sub-mode-hard"
                          onClick={() => setSubModeSim("Hardsub (Burn-in Re-encode to .mp4)")}
                          disabled={isDownloadingSim}
                          className={`text-[11px] font-bold py-1.5 px-2 rounded transition-all duration-150 cursor-pointer ${
                            subModeSim === "Hardsub (Burn-in Re-encode to .mp4)"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Hardsub (Burn-in Re-encode .mp4)
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Custom Filename (Optional):</label>
                      <input 
                        id="sim-filename-input"
                        type="text"
                        placeholder="Leave blank to use the video's original title"
                        value={customFilenameSim}
                        onChange={(e) => setCustomFilenameSim(e.target.value)}
                        disabled={isDownloadingSim}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-50 placeholder:text-slate-600"
                      />
                    </div>

                    {/* 6. Download Button */}
                    <div className="flex justify-center mt-2">
                      <button
                        id="sim-download-btn"
                        onClick={handleSimDownload}
                        disabled={!isFormatMenuEnabled || isDownloadingSim}
                        className="w-64 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-sm py-2 px-6 rounded transition-colors duration-150 disabled:text-slate-500 cursor-pointer shadow-lg"
                      >
                        {isDownloadingSim ? "Downloading..." : "Download"}
                      </button>
                    </div>

                    {/* 7. Progress UI (Progress bar and Status label) */}
                    <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-800/60">
                      
                      {/* CTkProgressBar visual */}
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                          style={{ width: `${simProgress * 100}%` }}
                        ></div>
                      </div>

                      {/* CTkLabel status message wrapper */}
                      <div className="text-center">
                        <p className={`text-xs font-mono font-medium ${simStatusColor} transition-colors duration-150 leading-relaxed`}>
                          {simStatusLabel}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Live Logger Console Footer */}
                  <div className="bg-slate-950 border-t border-slate-800 p-4 font-mono text-[11px] text-slate-300 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-slate-500 text-xs pb-1 border-b border-slate-900">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        Stdout / Multithreading Logger stream (yt-dlp)
                      </span>
                      <button 
                        id="clear-logs-btn"
                        onClick={() => setSimLogs([])}
                        className="hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="h-28 overflow-y-auto flex flex-col gap-1 pr-1 font-semibold select-text">
                      {simLogs.map((log, index) => (
                        <div key={index}>
                          <span className="text-slate-500 mr-1.5">&gt;</span>
                          <span className={
                            log.includes('SUCCESS') 
                              ? 'text-emerald-400' 
                              : log.includes('ERROR')
                                ? 'text-red-400'
                                : log.includes('Condition')
                                  ? 'text-amber-400'
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

              {/* Right Side: Presets Selector & Condition Guides */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
                
                {/* Emulator Preset selectors */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Emulator Presets (Condition Testing)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Select a preset to test different code condition paths instantly in the mockup:</p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {PRESETS.map((p, idx) => {
                      const isSelected = simulatorUrl === p.url && subtitleUrlSim === p.subtitleUrl;
                      return (
                        <button
                          key={idx}
                          id={`preset-btn-${idx}`}
                          onClick={() => handleSelectPreset(p)}
                          className={`w-full p-3.5 rounded-lg border text-left flex flex-col gap-1.5 transition-all hover:bg-slate-800/50 group cursor-pointer ${
                            isSelected 
                              ? 'bg-slate-800 border-blue-500/50 text-white shadow-md' 
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                              {p.provider === 'YouTube' ? <Video className="w-3.5 h-3.5 text-red-500" /> : p.provider === 'Vimeo' ? <Play className="w-3.5 h-3.5 text-sky-400" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                              {p.provider}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300">
                            {p.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Condition Boundary Block Explanation */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-400" />
                    How the Core Execution Logic Handles Conditions:
                  </h3>
                  
                  <div className="flex flex-col gap-3 text-xs leading-relaxed">
                    
                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                        <span>Condition A: Subtitle URL is EMPTY</span>
                        <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded uppercase font-mono">Video Only</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        The Python script invokes <code className="text-blue-400 font-mono text-[10px]">yt-dlp</code> directly, applying your selected format dropdown resolution and saving the downloaded streams cleanly into a standard video wrapper.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                        <span>Condition B: Subtitle URL is FILLED</span>
                        <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded uppercase font-mono">Video + Subs</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        1. Downloads the video track using yt-dlp first.<br />
                        2. Fetches the subtitle web text content from the URL via `requests.get()`. Saves locally as <code className="text-amber-400 font-mono text-[10px]">temp_subs.vtt</code>.<br />
                        3. Spawns an <code className="text-emerald-400 font-mono text-[10px]">ffmpeg</code> command to soft-embed the subtitle file into a single `.mkv` container without re-encoding.<br />
                        4. Deletes <code className="text-slate-300 font-mono text-[10px]">temp_subs.vtt</code> to leave a clean folder structure.
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            </>
          )}

          {/* TAB 2: PYTHON SOURCE CODE */}
          {activeTab === 'code' && (
            <div className="col-span-12 flex flex-col gap-4">
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                
                {/* Header and theme controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-white text-md flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-emerald-400" />
                      downloader.py Source Code
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Below is the complete, modular Python script. Choose a theme configuration to modify the script's theme variable live:</p>
                  </div>
                  
                  {/* Accent setting */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-2.5 rounded-lg">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">CustomTkinter Accent:</span>
                    <select 
                      id="theme-accent-selector"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        addLog(`[UI] Theme changed in generator: ${e.target.value}`);
                      }}
                      className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="dark-blue">Dark-Blue</option>
                    </select>
                  </div>
                </div>

                {/* Code viewport container */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                    <span className="text-xs text-slate-400 font-mono">downloader.py (Production Ready, self-contained)</span>
                    <div className="flex items-center gap-2">
                      <button 
                        id="copy-code-btn"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-all cursor-pointer border border-slate-700"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? 'Copied' : 'Copy Script'}
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

                  <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 select-all selection:bg-slate-800">
                    <pre className="whitespace-pre">{generatePythonCode(accentColor)}</pre>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: SYSTEM SETUP & PREREQUISITES */}
          {activeTab === 'setup' && (
            <div className="col-span-12 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Steps container */}
                <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="font-bold text-white text-lg">System Prerequisites & Launch Instructions</h3>
                    <p className="text-xs text-slate-400 mt-1">Execute the following setup sequences to get the downloader script working locally on your personal desktop environment:</p>
                  </div>

                  <div className="flex flex-col gap-6">
                    
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        1
                      </div>
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-white text-sm mb-1">Install PIP Python Packages</h4>
                        <p className="text-slate-400 leading-relaxed mb-3">
                          You will need standard python packages. Run this command inside your terminal/command prompt to fetch the core requirements (CustomTkinter UI component, yt-dlp scraping API, and requests library):
                        </p>
                        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-blue-400 flex items-center justify-between select-all">
                          <span>pip install customtkinter yt-dlp requests</span>
                          <button 
                            id="copy-pip-cmd"
                            onClick={() => {
                              navigator.clipboard.writeText("pip install customtkinter yt-dlp requests");
                              showToast("Copied pip install command!");
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
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        2
                      </div>
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                          Install FFmpeg System Dependency
                          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded uppercase font-semibold">Required</span>
                        </h4>
                        <p className="text-slate-400 leading-relaxed mb-3">
                          FFmpeg is essential for high quality formats (1080p, 4K) where platforms keep video and audio streams isolated on their servers. yt-dlp utilizes FFmpeg to sew them back together. 
                          It is also used for soft-embedding subtitle tracks into media packages (Condition B).
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded">
                            <span className="font-bold text-slate-200 block mb-1">macOS (Homebrew)</span>
                            <code className="text-blue-400 block font-mono text-[10px] mt-1 select-all bg-slate-950 px-1 py-0.5 rounded">brew install ffmpeg</code>
                          </div>
                          
                          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded">
                            <span className="font-bold text-slate-200 block mb-1">Windows (Chocolatey)</span>
                            <code className="text-blue-400 block font-mono text-[10px] mt-1 select-all bg-slate-950 px-1 py-0.5 rounded">choco install ffmpeg</code>
                          </div>

                          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded">
                            <span className="font-bold text-slate-200 block mb-1">Linux (APT)</span>
                            <code className="text-blue-400 block font-mono text-[10px] mt-1 select-all bg-slate-950 px-1 py-0.5 rounded">sudo apt install ffmpeg</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 border-t border-slate-800/80 pt-6">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        3
                      </div>
                      <div className="flex-1 text-xs">
                        <h4 className="font-bold text-white text-sm mb-1">Execute the App</h4>
                        <p className="text-slate-400 leading-relaxed mb-3">
                          Save the script inside a file named <code className="text-blue-400 font-mono">downloader.py</code> and execute it using the python interpreter inside your terminal:
                        </p>
                        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-blue-400 flex items-center justify-between select-all">
                          <span>python downloader.py</span>
                          <button 
                            id="copy-run-cmd"
                            onClick={() => {
                              navigator.clipboard.writeText("python downloader.py");
                              showToast("Copied python command!");
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

                {/* Right side helper FAQs */}
                <div className="md:col-span-4 flex flex-col gap-6">
                  
                  {/* FAQS card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-400" />
                      Downloader Q&A
                    </h3>
                    
                    <div className="flex flex-col gap-3 text-xs leading-relaxed">
                      
                      <div className="border-b border-slate-800 pb-3">
                        <strong className="text-slate-200 block mb-1">Why is my subtitle merge file mkv?</strong>
                        <span className="text-slate-400 block">
                          The Matroska container (.mkv) supports embedding WebVTT or SRT soft subtitles seamlessly without needing to re-encode the audio/video streams, resulting in near-instant processing.
                        </span>
                      </div>

                      <div className="border-b border-slate-800 pb-3">
                        <strong className="text-slate-200 block mb-1">Will this freeze the tkinter UI?</strong>
                        <span className="text-slate-400 block">
                          No! Both "Fetch Video Formats" and "Download" events launch distinct background daemon threads (<code className="text-blue-400 font-mono text-[10px]">threading.Thread</code>) so your desktop GUI remains responsive.
                        </span>
                      </div>

                      <div>
                        <strong className="text-slate-200 block mb-1">How can I update my local yt-dlp?</strong>
                        <span className="text-slate-400 block">
                          Platforms update their video systems regularly. If downloads start failing, run <code className="text-blue-400 font-mono text-[10px]">pip install -U yt-dlp</code> inside your terminal to upgrade.
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Policy and safety card */}
                  <div className="bg-blue-500/5 border border-blue-500/25 rounded-xl p-5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-white text-xs uppercase tracking-wider">Note on Dynamic php Links</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Our custom subtitle getter downloads the subtitle file as raw string text from any URL before saving locally. This guarantees that dynamic endpoints containing URL query arguments (such as <code className="text-slate-300 font-mono text-[10px]">?pid=123</code>) can be parsed cleanly.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* Elegant minimalist footer */}
      <footer className="border-t border-slate-800/80 py-5 bg-slate-950 px-6 shrink-0">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            <span>Universal Python Video Downloader • Companion Simulator & Builder</span>
          </div>
          <div className="flex items-center gap-4 font-semibold text-slate-400">
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> Python 3 + CustomTkinter GUI</span>
            <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5 text-blue-400" /> yt-dlp + requests + FFmpeg</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
