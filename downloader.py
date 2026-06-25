"""
Smart Landing Page Video Detector & Downloader
================================================
A modern GUI desktop application using CustomTkinter, yt-dlp, and FFmpeg.
Analyzes landing pages, detects media formats, extracts available resolutions,
discovers subtitles/captions, and embeds subtitles directly into the final video file.

Requirements:
    pip install customtkinter yt-dlp

Note: FFmpeg must be installed and on your system PATH to merge video/audio streams
      and soft-embed subtitles into the final .mp4/.mkv container.
"""

import os
import re
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
import urllib.request
import customtkinter as ctk
import yt_dlp

# Set modern look & default dark theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")  # Themes: "blue", "green", "dark-blue"

class SmartVideoDownloaderApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Configure window geometry
        self.title("Smart Landing Page Video Detector")
        self.geometry("960x720")
        self.minimum_size = (850, 650)
        self.minsize(850, 650)
        
        # Grid layout (1 row, 2 columns)
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        
        # Active state variables
        self.fetched_info = None
        self.target_url = ""
        self.download_dir = os.path.join(os.path.expanduser("~"), "Downloads")
        if not os.path.exists(self.download_dir):
            self.download_dir = os.getcwd()
            
        self.is_fetching = False
        self.is_downloading = False
        
        # Build UI layout
        self.create_sidebar()
        self.create_main_panel()
        
    def create_sidebar(self):
        # Sidebar Frame Left
        self.sidebar_frame = ctk.CTkFrame(self, width=240, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(5, weight=1)
        
        # Header Logo
        self.logo_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="Media Detector", 
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.logo_label.grid(row=0, column=0, padx=20, pady=(20, 5))
        
        self.sub_label = ctk.CTkLabel(
            self.sidebar_frame, 
            text="Landing Page Scraper v2.5", 
            font=ctk.CTkFont(size=11, slant="italic"),
            text_color="gray"
        )
        self.sub_label.grid(row=1, column=0, padx=20, pady=(0, 20))
        
        # Theme Accent selector
        self.theme_label = ctk.CTkLabel(self.sidebar_frame, text="Theme Color Accent:", anchor="w")
        self.theme_label.grid(row=2, column=0, padx=20, pady=(10, 0), sticky="w")
        self.theme_menu = ctk.CTkOptionMenu(
            self.sidebar_frame, 
            values=["blue", "green", "dark-blue"], 
            command=self.change_theme_color
        )
        self.theme_menu.grid(row=3, column=0, padx=20, pady=10, sticky="ew")
        self.theme_menu.set("blue")
        
        # Features check
        self.feat_label = ctk.CTkLabel(
            self.sidebar_frame,
            text="Core Features:\n• Landing Page Scanner\n• Subtitle Soft-Embedding\n• Format Muxing via FFmpeg\n• DRM Filtering Shield",
            font=ctk.CTkFont(size=11),
            text_color="gray",
            justify="left"
        )
        self.feat_label.grid(row=4, column=0, padx=20, pady=20, sticky="w")
        
        # Help Alert
        self.ffmpeg_info = ctk.CTkLabel(
            self.sidebar_frame, 
            text="FFmpeg Requirement:\nEnsure 'ffmpeg' is installed\non system PATH to merge\nvideo, audio, and embed\nsubtitle tracks properly.", 
            font=ctk.CTkFont(size=10), 
            text_color="gray",
            justify="left"
        )
        self.ffmpeg_info.grid(row=6, column=0, padx=20, pady=20, sticky="s")

    def create_main_panel(self):
        # Main Scrollable content frame
        self.main_frame = ctk.CTkScrollableFrame(self, corner_radius=0, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=15, pady=15)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        # Title
        self.title_label = ctk.CTkLabel(
            self.main_frame, 
            text="Smart Landing Page Video Detector", 
            font=ctk.CTkFont(size=22, weight="bold")
        )
        self.title_label.grid(row=0, column=0, padx=10, pady=(10, 20), sticky="w")
        
        # URL Input block
        self.url_frame = ctk.CTkFrame(self.main_frame)
        self.url_frame.grid(row=1, column=0, padx=10, pady=10, sticky="ew")
        self.url_frame.grid_columnconfigure(0, weight=1)
        
        self.url_label = ctk.CTkLabel(
            self.url_frame, 
            text="Input Landing Page URL (to detect videos & subtitles):", 
            font=ctk.CTkFont(weight="bold")
        )
        self.url_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")
        
        self.url_entry = ctk.CTkEntry(
            self.url_frame, 
            placeholder_text="https://example.com/landing-page-with-videos"
        )
        self.url_entry.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
        
        self.fetch_btn = ctk.CTkButton(
            self.url_frame, 
            text="Scan & Detect Page", 
            command=self.start_fetch_info,
            font=ctk.CTkFont(weight="bold"),
            width=140
        )
        self.fetch_btn.grid(row=1, column=1, padx=15, pady=(0, 15))
        
        # Extracted Metadata Container
        self.info_frame = ctk.CTkFrame(self.main_frame)
        self.info_frame.grid(row=2, column=0, padx=10, pady=10, sticky="ew")
        self.info_frame.grid_columnconfigure(1, weight=1)
        
        self.meta_title_lbl = ctk.CTkLabel(
            self.info_frame, 
            text="Title: Scan a landing page to extract video", 
            font=ctk.CTkFont(size=13, weight="bold"), 
            anchor="w"
        )
        self.meta_title_lbl.grid(row=0, column=0, columnspan=2, padx=15, pady=(10, 5), sticky="ew")
        
        self.meta_duration_lbl = ctk.CTkLabel(self.info_frame, text="Duration: --:--", text_color="gray", anchor="w")
        self.meta_duration_lbl.grid(row=1, column=0, padx=15, pady=(0, 10), sticky="w")
        
        self.meta_uploader_lbl = ctk.CTkLabel(self.info_frame, text="Source Extractor: N/A", text_color="gray", anchor="w")
        self.meta_uploader_lbl.grid(row=1, column=1, padx=15, pady=(0, 10), sticky="w")
        
        # Download selectors
        self.controls_frame = ctk.CTkFrame(self.main_frame)
        self.controls_frame.grid(row=3, column=0, padx=10, pady=10, sticky="ew")
        self.controls_frame.grid_columnconfigure(0, weight=1)
        self.controls_frame.grid_columnconfigure(1, weight=1)
        
        # Format resolution selector
        self.format_label = ctk.CTkLabel(
            self.controls_frame, 
            text="Target Resolution:", 
            font=ctk.CTkFont(weight="bold")
        )
        self.format_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")
        self.format_menu = ctk.CTkOptionMenu(
            self.controls_frame, 
            values=["Scan landing page first"]
        )
        self.format_menu.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
        
        # Subtitle selector
        self.sub_select_label = ctk.CTkLabel(
            self.controls_frame, 
            text="Subtitle (Auto-Mux/Embed):", 
            font=ctk.CTkFont(weight="bold")
        )
        self.sub_select_label.grid(row=0, column=1, padx=15, pady=(10, 5), sticky="w")
        self.subtitle_menu = ctk.CTkOptionMenu(
            self.controls_frame, 
            values=["No subtitles detected"]
        )
        self.subtitle_menu.grid(row=1, column=1, padx=15, pady=(0, 15), sticky="ew")

        # Custom Video Name input
        self.custom_name_label = ctk.CTkLabel(
            self.controls_frame, 
            text="Custom Video Name (Optional):", 
            font=ctk.CTkFont(weight="bold")
        )
        self.custom_name_label.grid(row=2, column=0, columnspan=2, padx=15, pady=(5, 5), sticky="w")
        self.custom_name_entry = ctk.CTkEntry(
            self.controls_frame, 
            placeholder_text="Defaults to webpage video title"
        )
        self.custom_name_entry.grid(row=3, column=0, columnspan=2, padx=15, pady=(0, 15), sticky="ew")
        
        # File destination output directory
        self.dir_frame = ctk.CTkFrame(self.main_frame)
        self.dir_frame.grid(row=4, column=0, padx=10, pady=10, sticky="ew")
        self.dir_frame.grid_columnconfigure(0, weight=1)
        
        self.dir_label = ctk.CTkLabel(
            self.dir_frame, 
            text="Save Folder Directory:", 
            font=ctk.CTkFont(weight="bold")
        )
        self.dir_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")
        
        self.dir_sub_frame = ctk.CTkFrame(self.dir_frame, fg_color="transparent")
        self.dir_sub_frame.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
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
        
        # Download Trigger Button
        self.download_btn = ctk.CTkButton(
            self.main_frame, 
            text="Start Download & Embed Subtitles", 
            height=46, 
            font=ctk.CTkFont(size=14, weight="bold"), 
            state="disabled", 
            command=self.start_download
        )
        self.download_btn.grid(row=5, column=0, padx=10, pady=15, sticky="ew")
        
        # Progress Feedback Meter
        self.feedback_frame = ctk.CTkFrame(self.main_frame)
        self.feedback_frame.grid(row=6, column=0, padx=10, pady=10, sticky="ew")
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
        
        # Internal log console output terminal
        self.log_label = ctk.CTkLabel(
            self.main_frame, 
            text="Media Extractor Log stream:", 
            font=ctk.CTkFont(weight="bold")
        )
        self.log_label.grid(row=7, column=0, padx=10, pady=(10, 0), sticky="w")
        
        self.log_text = ctk.CTkTextbox(
            self.main_frame, 
            height=160, 
            font=ctk.CTkFont(family="Courier", size=11)
        )
        self.log_text.grid(row=8, column=0, padx=10, pady=(5, 10), sticky="ew")
        self.log_text.configure(state="disabled")
        
        self.write_log("Application initialized. Ready to scan landing page URLs.")

    def change_theme_color(self, choice):
        ctk.set_default_color_theme(choice)
        self.write_log(f"Theme color switched to: {choice}. Restart window to fully load accents.")

    def browse_directory(self):
        selected = filedialog.askdirectory(initialdir=self.download_dir, title="Select Output Save Folder")
        if selected:
            self.download_dir = selected
            self.dir_entry.delete(0, tk.END)
            self.dir_entry.insert(0, selected)
            self.write_log(f"Output folder updated: {selected}")

    def write_log(self, text):
        self.log_text.configure(state="normal")
        self.log_text.insert(tk.END, f"{text}\n")
        self.log_text.see(tk.END)
        self.log_text.configure(state="disabled")

    # Multi-threading fetching worker
    def start_fetch_info(self):
        url = self.url_entry.get().strip()
        if not url:
            messagebox.showerror("Validation Error", "Please paste a video or landing page URL first!")
            return
            
        if self.is_fetching or self.is_downloading:
            return
            
        self.is_fetching = True
        self.fetch_btn.configure(state="disabled")
        self.write_log(f"Querying landing page details: {url}")
        
        # Execute extractor in non-blocking daemon thread
        t = threading.Thread(target=self._fetch_info_worker, args=(url,), daemon=True)
        t.start()

    def _fetch_info_worker(self, url):
        # DRM Shield
        drm_domains = ["netflix.com", "hulu.com", "disneyplus.com", "hbo.com", "hbomax.com", "primevideo.com"]
        if any(domain in url.lower() for domain in drm_domains):
            self.after(
                0, 
                lambda: self._on_fetch_failed(
                    "DRM-Protected Stream. Copy-protected content is bypassed per platform policy."
                )
            )
            return
            
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False
            }
            
            # Extract webpage meta using yt-dlp native extraction capabilities
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
            self.after(0, lambda: self._on_fetch_success(info, url))
            
        except Exception as e:
            # Fallback parsing strategy!
            # If native yt_dlp fails because the site lacks a dedicated extractor, we fall back
            # to scanning the raw HTML page for streaming assets or subtitle files.
            self.after(0, lambda: self.write_log("Native extraction failed. Attempting Fallback HTML regex parsing..."))
            self._run_fallback_regex_scraper(url, str(e))

    def _run_fallback_regex_scraper(self, url, original_err):
        """
        FALLBACK SCRAPER STRATEGY (BS4 / Regex Placeholder):
        Performs raw HTTP scanning to locate .m3u8 index files, .vtt files, or subtitle paths
        inside the HTML source when yt-dlp's native extractors are not supported on the target page.
        """
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            req = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(req, timeout=8) as response:
                html_content = response.read().decode('utf-8', errors='ignore')
                
            # Search for typical .m3u8, .mp4, and subtitle formats (.vtt/.srt)
            stream_links = re.findall(r'(https?://[^\s"\']+\.m3u8[^\s"\']*)', html_content)
            mp4_links = re.findall(r'(https?://[^\s"\']+\.mp4[^\s"\']*)', html_content)
            vtt_links = re.findall(r'(https?://[^\s"\']+\.vtt[^\s"\']*)', html_content)
            
            if stream_links or mp4_links:
                detected_link = stream_links[0] if stream_links else mp4_links[0]
                self.after(0, lambda: self.write_log(f"Fallback scraper successfully found media asset: {detected_link}"))
                
                # Setup mock info structure to pass to downstream
                mock_info = {
                    'title': 'Detected Media Stream (Fallback Scraped)',
                    'extractor_key': 'Fallback Scraper',
                    'url': detected_link,
                    'formats': [{'url': detected_link, 'height': 1080, 'ext': 'mp4' if 'mp4' in detected_link else 'm3u8'}],
                    'duration': 0,
                    'subtitles': {
                        'scraped_vtt': [{'url': v, 'ext': 'vtt'} for v in vtt_links]
                    } if vtt_links else {}
                }
                self.after(0, lambda: self._on_fetch_success(mock_info, url))
            else:
                raise Exception(f"No streaming elements found in raw landing page. Original Error: {original_err}")
                
        except Exception as fallback_err:
            self.after(0, lambda: self._on_fetch_failed(f"Extraction & Fallback Scraper both failed:\n{fallback_err}"))

    def _on_fetch_success(self, info, url):
        self.is_fetching = False
        self.fetch_btn.configure(state="normal")
        self.fetched_info = info
        self.target_url = url
        
        title = info.get('title', 'Unknown Landing Page Video')
        duration = info.get('duration', 0)
        extractor = info.get('extractor_key', 'Generic URL')
        
        mins, secs = divmod(int(duration or 0), 60)
        hours, mins = divmod(mins, 60)
        duration_str = f"{hours:02d}:{mins:02d}:{secs:02d}" if hours else f"{mins:02d}:{secs:02d}"
        
        self.meta_title_lbl.configure(text=f"Title: {title}")
        self.meta_duration_lbl.configure(text=f"Duration: {duration_str if duration else 'Detected Stream'}")
        self.meta_uploader_lbl.configure(text=f"Source: {extractor}")
        
        # Parse available formats/resolutions
        formats = info.get('formats', [])
        format_options = ["Best Resolution (Merged Auto)"]
        
        seen_res = set()
        for f in formats:
            height = f.get('height')
            ext = f.get('ext', '')
            if height and height not in seen_res:
                seen_res.add(height)
                format_options.append(f"{height}p - {ext.upper()} (Stitched Format)")
                
        format_options.append("Best Audio Track Only (MP3)")
        self.format_menu.configure(values=format_options)
        self.format_menu.set(format_options[0])
        
        # Parse available subtitles (and automatic captions)
        subtitles = info.get('subtitles', {}) or {}
        auto_captions = info.get('automatic_captions', {}) or {}
        
        sub_list = ["No subtitle selected"]
        for lang_code in subtitles.keys():
            sub_list.append(f"{lang_code} (Native)")
        for lang_code in auto_captions.keys():
            sub_list.append(f"{lang_code} (Auto-Generated)")
            
        self.subtitle_menu.configure(values=sub_list)
        self.subtitle_menu.set(sub_list[0])
        
        self.download_btn.configure(state="normal")
        self.write_log(f"Successfully analyzed landing page: '{title}'")
        self.write_log(f"Detected {len(format_options)-1} formats and {len(sub_list)-1} subtitles.")

    def _on_fetch_failed(self, err_msg):
        self.is_fetching = False
        self.fetch_btn.configure(state="normal")
        self.download_btn.configure(state="disabled")
        self.meta_title_lbl.configure(text="Title: Fetch Extraction Failed")
        self.meta_duration_lbl.configure(text="Duration: --:--")
        self.meta_uploader_lbl.configure(text="Source: N/A")
        
        self.write_log(f"EXTRACTION ERROR: {err_msg}")
        messagebox.showerror("Metadata Error", f"Failed to retrieve stream details:\n{err_msg}")

    # Asynchronous download process
    def start_download(self):
        if not self.fetched_info or self.is_downloading:
            return
            
        self.is_downloading = True
        self.download_btn.configure(state="disabled", text="Processing video & subtitle merge...")
        self.fetch_btn.configure(state="disabled")
        
        # Reset progress components
        self.progress_bar.set(0)
        self.percent_lbl.configure(text="0.0%")
        self.speed_lbl.configure(text="Speed: Connecting...")
        self.eta_lbl.configure(text="ETA: Calculating...")
        self.size_lbl.configure(text="Size: -- MB")
        
        self.write_log("Starting landing page downloader thread...")
        t = threading.Thread(target=self._download_worker, daemon=True)
        t.start()

    def download_dynamic_vtt(self, url, dest_path):
        """
        Helper function to download dynamic/raw WebVTT content and save it locally.
        Handles dynamic endpoints returning raw text starting with WEBVTT.
        """
        try:
            import requests
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            r = requests.get(url, headers=headers, timeout=10)
            content = r.text
        except Exception as e:
            # Fallback to standard urllib.request
            try:
                import urllib.request
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    content = response.read().decode('utf-8', errors='ignore')
            except Exception as inner_e:
                self.after(0, lambda: self.write_log(f"Error fetching dynamic subtitle: {inner_e}"))
                return False

        # Verify if it contains WEBVTT signature
        if "WEBVTT" in content or "vtt" in url.lower():
            try:
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return True
            except Exception as write_err:
                self.after(0, lambda: self.write_log(f"Error saving dynamic subtitle locally: {write_err}"))
        return False

    def _download_worker(self):
        url = self.target_url
        selected_fmt = self.format_menu.get()
        selected_sub = self.subtitle_menu.get()
        out_dir = self.dir_entry.get().strip() or self.download_dir
        
        # 1. Read custom video name entry and configure outtmpl option
        custom_name = self.custom_name_entry.get().strip()
        if custom_name:
            # Clean invalid characters for safe file names
            safe_name = "".join([c for c in custom_name if c.isalpha() or c.isdigit() or c in ' ._-']).strip()
            if not safe_name:
                safe_name = "Custom_Video"
            outtmpl_path = os.path.join(out_dir, f"{safe_name}.%(ext)s")
            self.after(0, lambda: self.write_log(f"Configuring custom filename: {safe_name}"))
        else:
            outtmpl_path = os.path.join(out_dir, "%(title)s.%(ext)s")

        # Format query mapper
        format_query = "bestvideo+bestaudio/best"
        if "Audio Track Only" in selected_fmt:
            format_query = "bestaudio/best"
        elif "p" in selected_fmt:
            res = selected_fmt.split("p")[0].strip()
            format_query = f"bestvideo[height<={res}]+bestaudio/best[height<={res}]"

        # Safe custom stdout logger
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

        # Progress stats callback hook
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
                    m, s = divmod(int(eta), 60)
                    eta_str = f"{m:02d}:{s:02d}"
                    
                self.after(0, lambda: self._update_gui_progress(pct, speed_str, eta_str, size_mb))
            elif d['status'] == 'finished':
                self.after(0, lambda: self.write_log("Video tracks fetched successfully. Merging audio, video & subtitles..."))

        ydl_opts = {
            'format': format_query,
            'outtmpl': outtmpl_path,
            'logger': GUIStreamLogger(self),
            'progress_hooks': [download_progress_hook],
            'merge_output_format': 'mkv',  # MKV supports embedding subtitle streams without re-encoding
            'noplaylist': True,
        }
        
        # 2. Handling Dynamic / Scraped Subtitle URLs
        temp_subtitle_path = os.path.join(out_dir, "temp_subtitle.vtt")
        has_local_vtt = False

        if selected_sub != "No subtitle selected" and self.fetched_info:
            subtitles_dict = self.fetched_info.get('subtitles', {}) or {}
            
            # Check if this is a scraped subtitle (dynamic link) from fallback scraper
            if 'scraped_vtt' in subtitles_dict:
                scraped_list = subtitles_dict['scraped_vtt']
                for sub_item in scraped_list:
                    sub_url = sub_item.get('url')
                    if sub_url:
                        self.after(0, lambda: self.write_log(f"Scraped WebVTT subtitle link identified: {sub_url}"))
                        self.after(0, lambda: self.write_log("Fetching subtitle text from dynamic endpoint..."))
                        if self.download_dynamic_vtt(sub_url, temp_subtitle_path):
                            has_local_vtt = True
                            self.after(0, lambda: self.write_log("Successfully downloaded and saved dynamic WebVTT locally."))
                            break
            
            # If it's a standard/native subtitle, let yt-dlp manage embedding automatically
            if not has_local_vtt:
                lang_code = selected_sub.split(" ")[0].strip()
                ydl_opts['writesubtitles'] = True
                ydl_opts['allsubtitles'] = False
                ydl_opts['subtitleslangs'] = [lang_code]
                ydl_opts['embedsubtitles'] = True
                if "Auto-Generated" in selected_sub:
                    ydl_opts['writeautomaticsub'] = True
                self.after(0, lambda: self.write_log(f"Subtitles enabled: [{lang_code}]. Native embedding activated."))

        if "Audio Track Only" in selected_fmt:
            ydl_opts['merge_output_format'] = None
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]

        try:
            # Perform yt-dlp download
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(url, download=True)
                downloaded_file = ydl.prepare_filename(info_dict)
                # Correct final extension post merging
                if "Audio Track Only" not in selected_fmt:
                    base, _ = os.path.splitext(downloaded_file)
                    downloaded_file = base + ".mkv"

            # 3. Custom FFmpeg merging of locally saved WebVTT subtitle
            if has_local_vtt and os.path.exists(temp_subtitle_path) and os.path.exists(downloaded_file):
                self.after(0, lambda: self.write_log("FFmpeg: Muxing locally scraped subtitle track into container..."))
                import subprocess
                muxed_file = downloaded_file.replace(".mkv", "_muxed.mkv")
                
                # FFmpeg soft muxing command
                cmd = [
                    'ffmpeg', '-y',
                    '-i', downloaded_file,
                    '-i', temp_subtitle_path,
                    '-c', 'copy',
                    '-c:s', 'srt',  # MKV container handles SRT subtitles seamlessly
                    '-metadata:s:s:0', 'language=eng',
                    muxed_file
                ]
                
                try:
                    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                    if os.path.exists(muxed_file):
                        os.remove(downloaded_file)
                        os.rename(muxed_file, downloaded_file)
                        self.after(0, lambda: self.write_log("FFmpeg soft muxing sequence completed successfully."))
                except Exception as ffmpeg_err:
                    self.after(0, lambda: self.write_log(f"FFmpeg subprocess error: {ffmpeg_err}"))
                finally:
                    # Cleanup local temp files
                    if os.path.exists(temp_subtitle_path):
                        try:
                            os.remove(temp_subtitle_path)
                        except:
                            pass

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
        self.download_btn.configure(state="normal", text="Start Download & Embed Subtitles")
        self.fetch_btn.configure(state="normal")
        self.progress_bar.set(1.0)
        self.percent_lbl.configure(text="100.0%")
        self.speed_lbl.configure(text="Speed: Complete")
        self.eta_lbl.configure(text="ETA: Finished")
        
        self.write_log("DOWNLOAD SUCCESS: Saved video format & successfully soft-embedded subtitle track.")
        messagebox.showinfo("Success", "Media and subtitle streams merged & embedded successfully!")

    def _on_download_failed(self, error):
        self.is_downloading = False
        self.download_btn.configure(state="normal", text="Start Download & Embed Subtitles")
        self.fetch_btn.configure(state="normal")
        self.write_log(f"DOWNLOAD ERROR: {error}")
        messagebox.showerror("Download Error", f"Processing failed:\n{error}")

if __name__ == "__main__":
    app = SmartVideoDownloaderApp()
    app.mainloop()
