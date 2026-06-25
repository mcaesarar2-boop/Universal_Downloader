"""
Universal Video Downloader
==========================
A modern GUI desktop application using CustomTkinter and yt-dlp.
Supports downloading from YouTube, raw HLS/m3u8 streams, and any other
non-DRM websites supported by yt-dlp. 

Requirements:
    pip install customtkinter yt-dlp
    
Note: FFmpeg is required on your system's PATH to stitch high-quality video
      and audio tracks, or to process HLS stream segments correctly.
"""

import os
import sys
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk
import yt_dlp

# Set modern look & default dark theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")  # Themes: "blue" (standard), "green", "dark-blue"

class VideoDownloaderApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Configure window geometry
        self.title("Universal Video Downloader")
        self.geometry("920x660")
        self.minimum_size = (800, 600)
        self.minsize(800, 600)
        
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
        self.sidebar_frame = ctk.CTkFrame(self, width=220, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        self.sidebar_frame.grid_rowconfigure(4, weight=1)
        
        # Header Logo
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
        self.theme_label = ctk.CTkLabel(self.sidebar_frame, text="Theme Color Accent:", anchor="w")
        self.theme_label.grid(row=2, column=0, padx=20, pady=(10, 0), sticky="w")
        self.theme_menu = ctk.CTkOptionMenu(
            self.sidebar_frame, 
            values=["blue", "green", "dark-blue"], 
            command=self.change_theme_color
        )
        self.theme_menu.grid(row=3, column=0, padx=20, pady=10, sticky="ew")
        self.theme_menu.set("blue")
        
        # Help Alert
        self.ffmpeg_info = ctk.CTkLabel(
            self.sidebar_frame, 
            text="FFmpeg Dependency Check:\nEnsure 'ffmpeg' is installed\non your system PATH\nto merge audio/video pairs\nand convert raw .m3u8 streams.", 
            font=ctk.CTkFont(size=10), 
            text_color="gray",
            justify="left"
        )
        self.ffmpeg_info.grid(row=5, column=0, padx=20, pady=20, sticky="s")

    def create_main_panel(self):
        # Main Scrollable content frame
        self.main_frame = ctk.CTkScrollableFrame(self, corner_radius=0, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=15, pady=15)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        # Title
        self.title_label = ctk.CTkLabel(
            self.main_frame, 
            text="Universal Media Downloader", 
            font=ctk.CTkFont(size=22, weight="bold")
        )
        self.title_label.grid(row=0, column=0, padx=10, pady=(10, 20), sticky="w")
        
        # URL Input block
        self.url_frame = ctk.CTkFrame(self.main_frame)
        self.url_frame.grid(row=1, column=0, padx=10, pady=10, sticky="ew")
        self.url_frame.grid_columnconfigure(0, weight=1)
        
        self.url_label = ctk.CTkLabel(
            self.url_frame, 
            text="Pasted Media URL or Stream (.m3u8):", 
            font=ctk.CTkFont(weight="bold")
        )
        self.url_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")
        
        self.url_entry = ctk.CTkEntry(
            self.url_frame, 
            placeholder_text="https://www.youtube.com/watch?v=..."
        )
        self.url_entry.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
        
        self.fetch_btn = ctk.CTkButton(
            self.url_frame, 
            text="Fetch Video Info", 
            command=self.start_fetch_info,
            width=130
        )
        self.fetch_btn.grid(row=1, column=1, padx=15, pady=(0, 15))
        
        # Extracted Metadata Container
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
            values=["Please Fetch Info First"]
        )
        self.format_menu.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
        
        # File destination output directory
        self.dir_label = ctk.CTkLabel(
            self.controls_frame, 
            text="Save Directory Path:", 
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
        
        # Download Trigger Button
        self.download_btn = ctk.CTkButton(
            self.main_frame, 
            text="Start Media Download", 
            height=42, 
            font=ctk.CTkFont(size=14, weight="bold"), 
            state="disabled", 
            command=self.start_download
        )
        self.download_btn.grid(row=4, column=0, padx=10, pady=15, sticky="ew")
        
        # Progress Feedback Meter
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
        
        # Internal log console output terminal
        self.log_label = ctk.CTkLabel(
            self.main_frame, 
            text="Terminal Diagnostics Log Stream:", 
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
        
        self.write_log("Application initialized successfully. Ready to paste media links.")

    def change_theme_color(self, choice):
        ctk.set_default_color_theme(choice)
        self.write_log(f"Theme color switched to: {choice}. Restart required to fully reload accents.")

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
            messagebox.showerror("Validation Error", "Please paste a video or HLS stream link first!")
            return
            
        if self.is_fetching or self.is_downloading:
            return
            
        self.is_fetching = True
        self.fetch_btn.configure(state="disabled")
        self.write_log(f"Querying link metadata: {url}")
        
        # Execute extractor in non-blocking daemon thread
        t = threading.Thread(target=self._fetch_info_worker, args=(url,), daemon=True)
        t.start()

    def _fetch_info_worker(self, url):
        # DRM Safety Policy: Explicitly bypass Widevine/Fairplay streaming domains
        drm_domains = ["netflix.com", "hulu.com", "disneyplus.com", "hbo.com", "hbomax.com", "primevideo.com"]
        if any(domain in url.lower() for domain in drm_domains):
            self.after(
                0, 
                lambda: self._on_fetch_failed(
                    "DRM-Protected Stream Detected. Netflix/Hulu copy-protected media is explicitly bypassed & ignored."
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
        
        title = info.get('title', 'Unknown Stream Title')
        duration = info.get('duration', 0)
        extractor = info.get('extractor_key', 'Generic URL')
        
        mins, secs = divmod(duration, 60)
        hours, mins = divmod(mins, 60)
        duration_str = f"{hours:02d}:{mins:02d}:{secs:02d}" if hours else f"{mins:02d}:{secs:02d}"
        
        self.meta_title_lbl.configure(text=f"Title: {title}")
        self.meta_duration_lbl.configure(text=f"Duration: {duration_str if duration else 'Live Stream'}")
        self.meta_uploader_lbl.configure(text=f"Source: {extractor}")
        
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
        self.download_btn.configure(state="normal")
        self.write_log(f"Successfully extracted details for: '{title}'")

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
        self.download_btn.configure(state="disabled", text="Downloading Stream tracks...")
        self.fetch_btn.configure(state="disabled")
        
        # Reset progress components
        self.progress_bar.set(0)
        self.percent_lbl.configure(text="0.0%")
        self.speed_lbl.configure(text="Speed: Connecting...")
        self.eta_lbl.configure(text="ETA: Calculating...")
        self.size_lbl.configure(text="Size: -- MB")
        
        self.write_log("Spawning download background thread...")
        t = threading.Thread(target=self._download_worker, daemon=True)
        t.start()

    def _download_worker(self):
        url = self.target_url
        selected_fmt = self.format_menu.get()
        out_dir = self.dir_entry.get().strip() or self.download_dir
        out_template = os.path.join(out_dir, "%(title)s.%(ext)s")
        
        # Format mapping configuration
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
                    m, s = divmod(eta, 60)
                    eta_str = f"{m:02d}:{s:02d}"
                    
                self.after(0, lambda: self._update_gui_progress(pct, speed_str, eta_str, size_mb))
            elif d['status'] == 'finished':
                self.after(0, lambda: self.write_log("Video segments retrieved. Calling FFmpeg stitcher..."))

        ydl_opts = {
            'format': format_query,
            'outtmpl': out_template,
            'logger': GUIStreamLogger(self),
            'progress_hooks': [download_progress_hook],
            'merge_output_format': 'mp4',
            'noplaylist': True,
        }
        
        if "Audio Track Only" in selected_fmt:
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
        self.speed_lbl.configure(text="Speed: Finished")
        self.eta_lbl.configure(text="ETA: Done")
        
        self.write_log("DOWNLOAD SUCCESS: Saved & processed stream formats correctly.")
        messagebox.showinfo("Success", "Media downloaded & merged successfully!")

    def _on_download_failed(self, error):
        self.is_downloading = False
        self.download_btn.configure(state="normal", text="Start Media Download")
        self.fetch_btn.configure(state="normal")
        self.write_log(f"DOWNLOAD ERROR: {error}")
        messagebox.showerror("Download Error", f"Processing failed:\n{error}")

if __name__ == "__main__":
    app = VideoDownloaderApp()
    app.mainloop()
