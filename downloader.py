"""
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
ctk.set_default_color_theme("blue")

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
        messagebox.showerror("Format Extraction Failed", f"Failed to retrieve format details:\n{error_msg}")

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
                "FFmpeg is not installed or not found on the system PATH.\n\n"
                "To download high-quality streams and merge subtitles, FFmpeg is required.\n"
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
                    
                    # Convert backslashes to forward slashes and escape the drive colon for Windows
                    ffmpeg_subs_path = os.path.abspath(temp_subs_path).replace('\\', '/').replace(':', '\\:')
                    cmd = [
                        'ffmpeg', '-y',
                        '-hwaccel', 'cuda',
                        '-i', final_video_path,
                        '-vf', f"subtitles='{ffmpeg_subs_path}'",
                        '-c:v', 'h264_nvenc',
                        '-preset', 'p6',
                        '-cq', '23',
                        '-b:v', '0',
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
                
                # Execute FFmpeg subprocess safely capturing stderr and stdout
                process = subprocess.run(cmd, capture_output=True, text=True)
                if process.returncode != 0:
                    raise Exception(f"FFmpeg Error:\n{process.stderr}")
                
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
        messagebox.showinfo("Success", f"Video download and pipeline process completed successfully!\nSaved to: {os.path.abspath(filepath)}")

    def _on_download_failed(self, error_msg):
        self.is_downloading = False
        self.download_button.configure(state="normal", text="Download")
        self.update_status(f"Error: {error_msg}", "#f87171")
        messagebox.showerror("Download Failed", f"An error occurred during download or post-processing:\n{error_msg}")

if __name__ == "__main__":
    app = UniversalVideoDownloader()
    app.mainloop()
