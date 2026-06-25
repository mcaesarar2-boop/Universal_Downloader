from flask import Flask, request, Response, jsonify
import os
import re
import json
import queue
import threading
import requests
import subprocess
import yt_dlp

app = Flask(__name__)

# Manual CORS setup to allow the React Frontend to communicate with this backend easily
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

def probe_bitrate(stream_url, height):
    """
    Attempts to probe the bitrate of a stream URL using ffprobe.
    Falls back to a resolution-based estimate if it fails.
    """
    if stream_url:
        try:
            cmd = [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=bit_rate',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                stream_url
            ]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
            if result.returncode == 0:
                output = result.stdout.strip()
                if output and output.isdigit():
                    bps = int(output)
                    kbps = int(bps / 1000)
                    if kbps > 0:
                        return f"~{kbps} kbps (Probed)"
        except Exception:
            pass
            
    # Resolution-based standard fallback estimation
    if height:
        try:
            h = int(height)
            if h >= 1080:
                return "~3500 kbps (Est.)"
            elif h >= 720:
                return "~2000 kbps (Est.)"
            elif h >= 480:
                return "~1000 kbps (Est.)"
            else:
                return "~500 kbps (Est.)"
        except (ValueError, TypeError):
            pass
    return "Unknown"

@app.route('/api/fetch', methods=['GET', 'POST'])
def fetch_formats():
    """
    Endpoint to retrieve available video formats from a stream URL.
    """
    url = ""
    if request.method == 'POST':
        data = request.get_json() or {}
        url = data.get('url', '')
    else:
        url = request.args.get('url', '')

    if not url:
        return jsonify({'error': 'Video URL parameter is required.'}), 400

    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            video_title = info.get('title', 'video')
            formats = info.get('formats', [])
            
            seen_resolutions = set()
            parsed_formats = []
            
            for f in formats:
                height = f.get('height')
                ext = f.get('ext') or 'mp4'
                # Prioritize formats with height values to avoid audio-only profiles
                if height and height not in seen_resolutions:
                    seen_resolutions.add(height)
                    vbr = f.get('vbr')
                    tbr = f.get('tbr')
                    bitrate_val = vbr or tbr
                    if bitrate_val:
                        bitrate_str = f"~{int(bitrate_val)} kbps"
                    else:
                        bitrate_str = probe_bitrate(f.get('url'), height)
                    parsed_formats.append({
                        'label': f"{height}p - {ext}",
                        'height': height,
                        'ext': ext,
                        'bitrate': bitrate_str
                    })
            
            parsed_formats.sort(key=lambda x: x['height'], reverse=True)
            
            return jsonify({
                'title': video_title,
                'formats': parsed_formats
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify_subtitle', methods=['GET', 'POST'])
def verify_subtitle():
    """
    Endpoint to verify subtitle tracks and ensure they are standard WebVTT or SRT.
    """
    url = ""
    if request.method == 'POST':
        data = request.get_json() or {}
        url = data.get('url', '')
    else:
        url = request.args.get('url', '')

    if not url:
        return jsonify({'error': 'Subtitle URL is required.'}), 400

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        
        content = r.text
        if "WEBVTT" in content or "-->" in content:
            return jsonify({
                'success': True,
                'message': 'Subtitle file validated successfully.'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Verification failed: Content does not appear to contain standard WebVTT or SRT structures.'
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/download')
def download_pipeline():
    """
    Server-Sent Events (SSE) stream endpoint.
    Downloads the video and processes subtitles using FFmpeg NVENC while pushing real-time log messages and progress metrics to the web client.
    """
    url = request.args.get('url', '')
    selected_fmt = request.args.get('selected_format', 'Best (Default)')
    subtitle_url = request.args.get('subtitle_url', '')
    sub_mode = request.args.get('sub_mode', 'Softsub (Fast Remux to .mkv)')
    target_bitrate = request.args.get('target_bitrate', '1300k')
    custom_name = request.args.get('custom_name', '')

    if not url:
        def err_gen():
            yield f"data: {json.dumps({'type': 'error', 'message': 'Missing video URL parameter'})}\n\n"
        return Response(err_gen(), mimetype='text/event-stream')

    q = queue.Queue()

    # Worker thread to run yt-dlp and FFmpeg asynchronously
    def download_thread_worker():
        try:
            # Step A: Query video title
            q.put({'type': 'log', 'message': '[system] Contacting extractor engine to resolve video title...'})
            ydl_opts_meta = {'quiet': True, 'no_warnings': True, 'extract_flat': False}
            with yt_dlp.YoutubeDL(ydl_opts_meta) as ydl:
                info = ydl.extract_info(url, download=False)
                video_title = info.get('title', 'video')

            # Configure output template
            if custom_name:
                clean_name = "".join([c for c in custom_name if c.isalpha() or c.isdigit() or c in ' ._-']).strip() or "custom_video"
                out_template = f"{clean_name}.%(ext)s"
            else:
                out_template = "%(title)s.%(ext)s"

            q.put({'type': 'log', 'message': f"[system] Output template set to: {out_template}"})

            # Formulate yt-dlp resolution filter
            format_query = 'bestvideo+bestaudio/best'
            if selected_fmt != "Best (Default)" and "p" in selected_fmt:
                try:
                    res = selected_fmt.split("p")[0].strip()
                    format_query = f"bestvideo[height<={res}]+bestaudio/best[height<={res}]"
                except:
                    pass
            q.put({'type': 'log', 'message': f"[system] Resolution selection pattern: {format_query}"})

            # Progress tracker state
            last_logged_pct = [-1]

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
                    
                    # Update status and slider progress
                    q.put({
                        'type': 'progress',
                        'progress': pct,
                        'percentage': f"{pct_percentage:.1f}%",
                        'status': status_text
                    })

                    # Throttle verbose logs to whole percent numbers
                    current_pct_int = int(pct_percentage)
                    if current_pct_int > last_logged_pct[0]:
                        last_logged_pct[0] = current_pct_int
                        dl_mb = downloaded / (1024 * 1024)
                        tot_mb = total / (1024 * 1024)
                        log_line = f"[yt-dlp] Progress: {pct_percentage:.1f}% ({dl_mb:.1f}MB/{tot_mb:.1f}MB) | Speed: {speed_str} | ETA: {eta_str}"
                        q.put({'type': 'log', 'message': log_line})
                        
                elif d['status'] == 'finished':
                    q.put({'type': 'status', 'text': 'Video download complete. Merging streams...'})
                    q.put({'type': 'log', 'message': '[yt-dlp] Video download complete. Moving to post-processing step...'})

            # Download Options
            ydl_opts = {
                'format': format_query,
                'outtmpl': out_template,
                'merge_output_format': 'mp4',
                'progress_hooks': [progress_hook],
                'quiet': True,
                'no_warnings': True
            }

            q.put({'type': 'log', 'message': '[yt-dlp] Launching download engine...'})
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info_dict = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info_dict)

            # Check actual downloaded path (handling automatic merger formats)
            base, _ = os.path.splitext(filename)
            final_video_path = None
            for ext in ['.mp4', '.mkv', '.webm']:
                test_path = base + ext
                if os.path.exists(test_path):
                    final_video_path = test_path
                    break

            if not final_video_path:
                raise FileNotFoundError("yt-dlp finished download, but cannot locate the output media file on disk.")

            q.put({'type': 'log', 'message': f"[system] Local raw video file verified: {final_video_path}"})

            # Step B: Subtitle integration
            temp_subs_path = os.path.abspath("temp_subs.vtt")
            has_subtitle = os.path.exists(temp_subs_path)

            if not has_subtitle and subtitle_url:
                q.put({'type': 'status', 'text': 'Fetching subtitle track from URL...'})
                q.put({'type': 'log', 'message': f"[system] Subtitle 'temp_subs.vtt' missing. Downloading fallback: {subtitle_url}"})
                headers = {'User-Agent': 'Mozilla/5.0'}
                sub_res = requests.get(subtitle_url, headers=headers, timeout=15)
                sub_res.raise_for_status()
                with open(temp_subs_path, "w", encoding="utf-8") as sub_file:
                    sub_file.write(sub_res.text)
                has_subtitle = True
                q.put({'type': 'log', 'message': "[system] Subtitle download complete. Saved as 'temp_subs.vtt'"})

            if has_subtitle:
                is_hardsub = "Hardsub" in sub_mode
                name_no_ext, _ = os.path.splitext(final_video_path)

                if is_hardsub:
                    q.put({'type': 'status', 'text': 'Re-encoding video with hardsubs (Burn-in)...'})
                    output_video_path = f"{name_no_ext}_hardsubbed.mp4"
                    
                    # Calculate double target bitrate for visual buffer limits
                    bufsize = "2600k"
                    try:
                        match = re.match(r'^(\d+)(k|M|m|K)?$', target_bitrate)
                        if match:
                            val = int(match.group(1))
                            unit = match.group(2) or 'k'
                            bufsize = f"{val * 2}{unit}"
                    except Exception:
                        pass

                    # Escape subtitle path for FFmpeg subtitles filter
                    ffmpeg_subs_path = os.path.abspath(temp_subs_path).replace('\\', '/').replace(':', '\\:')
                    cmd = [
                        'ffmpeg', '-y',
                        '-hwaccel', 'cuda',
                        '-i', final_video_path,
                        '-vf', f"subtitles='{ffmpeg_subs_path}'",
                        '-c:v', 'h264_nvenc',
                        '-preset', 'p6',
                        '-b:v', target_bitrate,
                        '-maxrate', target_bitrate,
                        '-bufsize', bufsize,
                        '-c:a', 'copy',
                        output_video_path
                    ]
                else:
                    q.put({'type': 'status', 'text': 'Muxing video & subtitle with FFmpeg...'})
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

                q.put({'type': 'log', 'message': f"[FFmpeg] Launching subprocess command:\n{' '.join(cmd)}"})
                
                # Execute FFmpeg with real-time feedback
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    universal_newlines=True
                )

                for line in process.stdout:
                    clean_line = line.strip()
                    if clean_line:
                        q.put({'type': 'log', 'message': f"[FFmpeg] {clean_line}"})
                        
                        # Parse encoding info in real time
                        frame_match = re.search(r'frame=\s*(\d+)', clean_line)
                        time_match = re.search(r'time=\s*([\d:\.]+)', clean_line)
                        speed_match = re.search(r'speed=\s*([\d\.]+)x', clean_line)

                        frame_val = frame_match.group(1) if frame_match else None
                        time_val = time_match.group(1) if time_match else None
                        speed_val = speed_match.group(1) if speed_match else None

                        if frame_val or time_val:
                            status_msg = "Re-encoding (Hardsub)..." if is_hardsub else "Remuxing (Softsub)..."
                            details = []
                            if frame_val:
                                details.append(f"Frame: {frame_val}")
                            if time_val:
                                details.append(f"Time: {time_val}")
                            if speed_val:
                                details.append(f"Speed: {speed_val}x")
                            q.put({'type': 'status', 'text': f"{status_msg} " + " | ".join(details)})

                process.wait()
                if process.returncode != 0:
                    raise Exception(f"FFmpeg pipeline returned non-zero error code: {process.returncode}")

                # Verify and cleanup
                if os.path.exists(output_video_path):
                    try:
                        os.remove(final_video_path)
                    except:
                        pass
                    try:
                        os.remove(temp_subs_path)
                    except:
                        pass
                    final_video_path = output_video_path
                    msg = "Subtitle track hardsubbed successfully." if is_hardsub else "Subtitle track remuxed successfully."
                    q.put({'type': 'status', 'text': msg, 'color': '#4ade80'})
                    q.put({'type': 'log', 'message': f"[system] {msg}"})
                else:
                    raise Exception("FFmpeg processes exited successfully, but no output package was located.")

            # Pipeline Success!
            q.put({
                'type': 'complete',
                'filepath': os.path.abspath(final_video_path),
                'filename': os.path.basename(final_video_path)
            })

        except Exception as e:
            q.put({'type': 'error', 'message': str(e)})
        finally:
            q.put(None) # Signal generator thread to terminate

    # Spawn processing thread
    threading.Thread(target=download_thread_worker, daemon=True).start()

    # Generator streaming queue contents back to client
    def event_stream_generator():
        while True:
            item = q.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

    return Response(event_stream_generator(), mimetype='text/event-stream')

if __name__ == '__main__':
    print("-------------------------------------------------------")
    print("   Universal Video Downloader API Running Local Server")
    print("   API Endpoint: http://localhost:5000")
    print("-------------------------------------------------------")
    app.run(host='0.0.0.0', port=5000, debug=True)
