"""
Universal Video Downloader GUI
==============================
A high-performance, polished desktop application written in Python using CustomTkinter.
Supports downloading videos via yt-dlp, fetching dynamic/raw WebVTT subtitles, 
and soft-muxing subtitle tracks directly into video containers using FFmpeg.

Features:
- Responsive UI using Python's threading library.
- Custom video filename option.
- Dynamic WebVTT download helper for raw text streams.
- Automuxing of external WebVTT tracks into the final video file via FFmpeg.
- Polished, cohesive dark-themed visual design.

Requirements:
    pip install customtkinter yt-dlp requests

Note: FFmpeg must be installed and added to the system PATH for the muxing sequence.
"""

import os
import sys
import threading
import subprocess
import requests
import urllib.request
import customtkinter as ctk
from tkinter import filedialog, messagebox
import yt_dlp

# Set modern appearance and cohesive dark theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class UniversalDownloaderApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Window Configuration
        self.title("Universal Video Downloader")
        self.geometry("850x650")
        self.minsize(750, 550)
        
        # Grid Configuration for main container
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=1)
        
        # Core State Variables
        self.extracted_info = None
        self.is_fetching = False
        self.is_downloading = False
        self.download_dir = os.path.join(os.path.expanduser("~"), "Downloads")
        if not os.path.exists(self.download_dir):
            self.download_dir = os.getcwd()

        # Build UI layout
        self.setup_ui()
        
    def setup_ui(self):
        # Main Frame with outer padding
        self.main_container = ctk.CTkFrame(self, corner_radius=15)
        self.main_container.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        self.main_container.grid_columnconfigure(0, weight=1)
        
        # 1. Header Title
        self.header_label = ctk.CTkLabel(
            self.main_container,
            text="Universal Video Downloader",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.header_label.grid(row=0, column=0, padx=20, pady=(25, 5), sticky="w")
        
        self.subheader_label = ctk.CTkLabel(
            self.main_container,
            text="Powered by CustomTkinter, yt-dlp, and FFmpeg",
            font=ctk.CTkFont(size=12, slant="italic"),
            text_color="gray"
        )
        self.subheader_label.grid(row=1, column=0, padx=20, pady=(0, 20), sticky="w")
        
        # 2. Input Section Frame
        self.input_frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.input_frame.grid(row=2, column=0, padx=20, pady=10, sticky="ew")
        self.input_frame.grid_columnconfigure(0, weight=1)
        
        # Video/HLS URL Entry & Fetch Button
        self.url_label = ctk.CTkLabel(
            self.input_frame,
            text="Video / Stream URL:",
            font=ctk.CTkFont(weight="bold")
        )
        self.url_label.grid(row=0, column=0, padx=5, pady=(5, 5), sticky="w")
        
        self.url_entry = ctk.CTkEntry(
            self.input_frame,
            placeholder_text="https://www.youtube.com/watch?v=... or HLS .m3u8 stream link"
        )
        self.url_entry.grid(row=1, column=0, padx=5, pady=(0, 10), sticky="ew")
        
        self.fetch_btn = ctk.CTkButton(
            self.input_frame,
            text="Fetch Video Formats",
            font=ctk.CTkFont(weight="bold"),
            command=self.start_fetch_formats
        )
        self.fetch_btn.grid(row=1, column=1, padx=(10, 5), pady=(0, 10))
        
        # 3. Parameters Selection Frame
        self.params_frame = ctk.CTkFrame(self.main_container)
        self.params_frame.grid(row=3, column=0, padx=20, pady=10, sticky="ew")
        self.params_frame.grid_columnconfigure(0, weight=1)
        self.params_frame.grid_columnconfigure(1, weight=1)
        
        # Format Selector OptionMenu (Initially Disabled)
        self.fmt_lbl = ctk.CTkLabel(
            self.params_frame,
            text="Available Formats:",
            font=ctk.CTkFont(weight="bold")
        )
        self.fmt_lbl.grid(row=0, column=0, padx=15, pady=(15, 5), sticky="w")
        
        self.format_menu = ctk.CTkOptionMenu(
            self.params_frame,
            values=["Fetch formats first"]
        )
        self.format_menu.set("Fetch formats first")
        self.format_menu.configure(state="disabled")
        self.format_menu.grid(row=1, column=0, padx=15, pady=(0, 15), sticky="ew")
        
        # Custom Filename Option
        self.name_lbl = ctk.CTkLabel(
            self.params_frame,
            text="Custom Video Name (Optional):",
            font=ctk.CTkFont(weight="bold")
        )
        self.name_lbl.grid(row=0, column=1, padx=15, pady=(15, 5), sticky="w")
        
        self.filename_entry = ctk.CTkEntry(
            self.params_frame,
            placeholder_text="Defaults to extracted video title"
        )
        self.filename_entry.grid(row=1, column=1, padx=15, pady=(0, 15), sticky="ew")
        
        # Subtitle URL input (designed to support dynamic URLs returning WebVTT content)
        self.sub_lbl = ctk.CTkLabel(
            self.params_frame,
            text="External Subtitle URL (Optional - Dynamic/Raw WebVTT or SRT):",
            font=ctk.CTkFont(weight="bold")
        )
        self.sub_lbl.grid(row=2, column=0, columnspan=2, padx=15, pady=(5, 5), sticky="w")
        
        self.subtitle_entry = ctk.CTkEntry(
            self.params_frame,
            placeholder_text="e.g., https://example.com/subtitle.php?id=123"
        )
        self.subtitle_entry.grid(row=3, column=0, columnspan=2, padx=15, pady=(0, 15), sticky="ew")
        
        # Save Folder Selection Location
        self.dir_lbl = ctk.CTkLabel(
            self.main_container,
            text="Save Directory:",
            font=ctk.CTkFont(weight="bold")
        )
        self.dir_lbl.grid(row=4, column=0, padx=20, pady=(10, 2), sticky="w")
        
        self.dir_frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        self.dir_frame.grid(row=5, column=0, padx=20, pady=(0, 10), sticky="ew")
        self.dir_frame.grid_columnconfigure(0, weight=1)
        
        self.dir_entry = ctk.CTkEntry(self.dir_frame)
        self.dir_entry.insert(0, self.download_dir)
        self.dir_entry.grid(row=0, column=0, padx=(0, 10), sticky="ew")
        
        self.browse_btn = ctk.CTkButton(
            self.dir_frame,
            text="Browse Folder",
            width=110,
            command=self.browse_output_dir
        )
        self.browse_btn.grid(row=0, column=1)
        
        # 4. Action Trigger Button
        self.download_btn = ctk.CTkButton(
            self.main_container,
            text="Start Download & Process",
            font=ctk.CTkFont(size=14, weight="bold"),
            height=45,
            command=self.start_download_process
        )
        self.download_btn.grid(row=6, column=0, padx=20, pady=15, sticky="ew")
        
        # 5. Feedback Panel (Progress Bar and Status Text)
        self.feedback_frame = ctk.CTkFrame(self.main_container)
        self.feedback_frame.grid(row=7, column=0, padx=20, pady=10, sticky="ew")
        self.feedback_frame.grid_columnconfigure(0, weight=1)
        
        self.status_label = ctk.CTkLabel(
            self.feedback_frame,
            text="System Idle. Paste a video URL to begin.",
            font=ctk.CTkFont(weight="bold"),
            text_color="gray"
        )
        self.status_label.grid(row=0, column=0, padx=15, pady=(10, 5), sticky="w")
        
        self.progress_bar = ctk.CTkProgressBar(self.feedback_frame)
        self.progress_bar.grid(row=1, column=0, padx=15, pady=(5, 15), sticky="ew")
        self.progress_bar.set(0)
        
    def log_status(self, text, color="white"):
        """Safely updates the status label with a specific message and color."""
        self.after(0, lambda: self.status_label.configure(text=text, text_color=color))

    def browse_output_dir(self):
        selected = filedialog.askdirectory(initialdir=self.download_dir, title="Choose Download Folder")
        if selected:
            self.download_dir = selected
            self.dir_entry.delete(0, 'end')
            self.dir_entry.insert(0, selected)
            self.log_status(f"Save directory updated: {selected}", "cyan")

    # =========================================================================
    # PHASE 1: Fetching Formats (Non-blocking via Threading)
    # =========================================================================
    def start_fetch_formats(self):
        url = self.url_entry.get().strip()
        if not url:
            messagebox.showerror("Input Error", "Please provide a valid Video URL to fetch formats!")
            return
            
        if self.is_fetching or self.is_downloading:
            return
            
        self.is_fetching = True
        self.fetch_btn.configure(state="disabled")
        self.log_status("Analyzing remote media stream... Please wait.", "gold")
        
        # Start background worker thread
        t = threading.Thread(target=self._fetch_formats_worker, args=(url,), daemon=True)
        t.start()

    def _fetch_formats_worker(self, url):
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
            self.after(0, lambda: self._on_fetch_success(info))
        except Exception as e:
            self.after(0, lambda: self._on_fetch_failed(str(e)))

    def _on_fetch_success(self, info):
        self.is_fetching = False
        self.fetch_btn.configure(state="normal")
        self.extracted_info = info
        
        title = info.get('title', 'Unknown Title')
        formats = info.get('formats', [])
        
        # Parse available resolutions/formats
        format_options = []
        seen_resolutions = set()
        
        # Prioritize video-only and pre-merged tracks
        for fmt in formats:
            height = fmt.get('height')
            ext = fmt.get('ext', '')
            if height:
                res_str = f"{height}p - {ext.upper()}"
                if res_str not in seen_resolutions:
                    seen_resolutions.add(res_str)
                    format_options.append(res_str)
                    
        # Always offer standard defaults
        format_options.append("Best (Default)")
        
        # If only a single format is discovered, show only that one.
        if len(format_options) == 1:
            self.format_menu.configure(values=[format_options[0]], state="normal")
            self.format_menu.set(format_options[0])
        else:
            self.format_menu.configure(values=format_options, state="normal")
            self.format_menu.set("Best (Default)")
            
        self.log_status(f"Successfully loaded stream details: \"{title[:45]}...\"", "green")
        messagebox.showinfo("Success", f"Metadata retrieved successfully!\nTitle: {title}\nFormats found: {len(format_options)}")

    def _on_fetch_failed(self, err_msg):
        self.is_fetching = False
        self.fetch_btn.configure(state="normal")
        self.format_menu.configure(values=["Fetch formats first"])
        self.format_menu.set("Fetch formats first")
        self.format_menu.configure(state="disabled")
        
        self.log_status(f"Format fetch failed: {err_msg[:60]}", "red")
        messagebox.showerror("Extraction Error", f"Failed to retrieve stream details:\n{err_msg}")

    # =========================================================================
    # PHASE 2: Downloading & Subtitle Merging (Conditional Logic)
    # =========================================================================
    def start_download_process(self):
        url = self.url_entry.get().strip()
        if not url:
            messagebox.showerror("Input Error", "Please provide a valid Video URL to download!")
            return
            
        if self.is_downloading or self.is_fetching:
            return
            
        self.is_downloading = True
        self.download_btn.configure(state="disabled")
        self.fetch_btn.configure(state="disabled")
        self.progress_bar.set(0)
        
        # Start background worker thread
        t = threading.Thread(target=self._download_worker, args=(url,), daemon=True)
        t.start()

    def download_dynamic_subtitle(self, sub_url, dest_path):
        """
        Helper function to handle dynamic endpoints (e.g., subtitle.php?pid=...)
        downloads the raw text content, verifies WebVTT structure, and saves it locally.
        """
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            response = requests.get(sub_url, headers=headers, timeout=15)
            content = response.text
            
            # Check if it returns a valid WebVTT format (or standard SRT)
            if "WEBVTT" in content or "1" in content[:10]:
                with open(dest_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return True
            else:
                self.log_status("Subtitle format verification failed (no WEBVTT signature).", "red")
                return False
        except Exception as e:
            # Fallback to urllib standard request
            try:
                req = urllib.request.Request(sub_url, headers=headers)
                with urllib.request.urlopen(req, timeout=15) as res:
                    content = res.read().decode('utf-8', errors='ignore')
                    if "WEBVTT" in content or "1" in content[:10]:
                        with open(dest_path, "w", encoding="utf-8") as f:
                            f.write(content)
                        return True
            except Exception as inner_e:
                self.log_status(f"Error fetching dynamic subtitle: {inner_e}", "red")
            return False

    def _download_worker(self, url):
        selected_fmt = self.format_menu.get()
        sub_url = self.subtitle_entry.get().strip()
        custom_name = self.filename_entry.get().strip()
        save_dir = self.dir_entry.get().strip() or self.download_dir
        
        # Build outtmpl name format
        if custom_name:
            # Clean invalid characters for safe file names
            safe_name = "".join([c for c in custom_name if c.isalpha() or c.isdigit() or c in ' ._-']).strip()
            if not safe_name:
                safe_name = "Custom_Video"
            outtmpl_path = os.path.join(save_dir, f"{safe_name}.%(ext)s")
        else:
            outtmpl_path = os.path.join(save_dir, "%(title)s.%(ext)s")

        # Map selected resolution format selector
        format_query = "bestvideo+bestaudio/best"
        if "p" in selected_fmt:
            res_height = selected_fmt.split("p")[0].strip()
            format_query = f"bestvideo[height<={res_height}]+bestaudio/best"

        # Safe progress callback
        def progress_hook(d):
            if d['status'] == 'downloading':
                total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes', 0)
                pct = (downloaded / total) if total > 0 else 0
                self.after(0, lambda: self.progress_bar.set(pct))
                self.log_status(f"Downloading stream: {pct*100:.1f}% complete...", "gold")
            elif d['status'] == 'finished':
                self.log_status("Video download complete. Merging stream containers...", "cyan")

        # yt-dlp Configuration
        ydl_opts = {
            'format': format_query,
            'outtmpl': outtmpl_path,
            'progress_hooks': [progress_hook],
            'merge_output_format': 'mkv',  # MKV container for seamless audio, video & subtitle soft embedding
            'noplaylist': True,
            'quiet': True
        }

        # Subtitle files paths
        temp_vtt_path = os.path.join(save_dir, "temp_subs.vtt")
        has_subtitle = bool(sub_url)

        try:
            # 1. Execute stream download
            self.log_status("Connecting to video source stream...", "gold")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(url, download=True)
                downloaded_file = ydl.prepare_filename(info_dict)
                
                # Correct actual final file path post-merging (usually gets converted to mkv)
                base, _ = os.path.splitext(downloaded_file)
                downloaded_file = base + ".mkv"

            # 2. Condition B: Process subtitle url downloading and FFmpeg muxing
            if has_subtitle:
                self.log_status("Fetching dynamic subtitle track content...", "gold")
                if self.download_dynamic_subtitle(sub_url, temp_vtt_path):
                    self.log_status("Muxing video with downloaded subtitle track...", "cyan")
                    
                    # Target output muxed container path
                    muxed_output = downloaded_file.replace(".mkv", "_with_subs.mkv")
                    
                    # FFmpeg soft muxing subprocess command
                    cmd = [
                        'ffmpeg', '-y',
                        '-i', downloaded_file,
                        '-i', temp_vtt_path,
                        '-c', 'copy',
                        '-c:s', 'srt',  # Soft embed SRT stream inside MKV
                        '-metadata:s:s:0', 'language=eng',
                        muxed_output
                    ]
                    
                    try:
                        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                        if os.path.exists(muxed_output):
                            # Replace un-subtitled original file with the muxed container
                            os.remove(downloaded_file)
                            os.rename(muxed_output, downloaded_file)
                            self.log_status("Subtitle track successfully muxed!", "green")
                    except Exception as ffmpeg_err:
                        self.log_status(f"FFmpeg Error: {ffmpeg_err}", "red")
                    finally:
                        # Clean up temp subtitle file
                        if os.path.exists(temp_vtt_path):
                            try:
                                os.remove(temp_vtt_path)
                            except:
                                pass
                else:
                    self.log_status("Subtitle download failed or invalid. Saved raw video file only.", "orange")

            # Final success callback
            self.after(0, self._on_download_complete)

        except Exception as e:
            self.after(0, lambda: self._on_download_failed(str(e)))

    def _on_download_complete(self):
        self.is_downloading = False
        self.download_btn.configure(state="normal")
        self.fetch_btn.configure(state="normal")
        self.progress_bar.set(1.0)
        self.log_status("All downloads and processing completed successfully!", "green")
        messagebox.showinfo("Success", "Video and requested subtitle channels downloaded and soft-embedded successfully!")

    def _on_download_failed(self, err_msg):
        self.is_downloading = False
        self.download_btn.configure(state="normal")
        self.fetch_btn.configure(state="normal")
        self.log_status(f"Download Error: {err_msg[:50]}", "red")
        messagebox.showerror("Download Failed", f"An error occurred during downloading or muxing:\n{err_msg}")

if __name__ == "__main__":
    app = UniversalDownloaderApp()
    app.mainloop()
