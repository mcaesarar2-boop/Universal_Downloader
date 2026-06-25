# READ_FIRST.md — Universal Video Downloader

A high-performance, feature-rich media acquisition pipeline combining `yt-dlp` for raw extraction and `FFmpeg` with NVIDIA hardware acceleration (NVENC) for instantaneous subtitle integration and stream remuxing. 

Featuring both a high-fidelity **Desktop Graphical User Interface** (built using modern `customtkinter`) and an **Adaptive Web Interface**, this suite offers a unified downloader engine tailored for power users, developers, and creators.

---

## 1. Project Overview

The **Universal Video Downloader** is designed to bypass the traditional bottlenecks of stream acquisition and subtitle rendering. While standard tools run single-threaded CPU transcoding, this pipeline leverages state-of-the-art GPU-accelerated computing to burn subtitles in real-time.

### Core Capabilities
* **Universal Media Extraction**: Seamless extraction of streaming media, HLS manifests (`.m3u8`), Dash manifests, and raw streams from YouTube and hundreds of other non-DRM platforms via robust `yt-dlp` integration.
* **Smart Subtitle Pipeline**: Live validation and conversion of dynamic web subtitle URLs (such as dynamic PHP-served WebVTT/SRT endpoints) into standard compliant, sanitized local WebVTT tracks.
* **Dual-Mode Subtitle Post-Processing**:
  * **Softsub (Fast Remux)**: Instantaneous packet-level multiplexing into an `.mkv` container, preserving original streams with zero quality degradation.
  * **Hardsub (GPU-Accelerated Burn-In)**: Full-frame video re-encoding with burned-in subtitles utilizing **NVIDIA CUDA & NVENC** (`h264_nvenc`) to offload 100% of the computation from your CPU to your GPU.
* **Strict Bitrate Constraint Engine**: A user-adjustable target bitrate system coupled with maximum rate ceiling controls and dynamic look-ahead buffer sizes to guarantee consistent, highly polished video output without file size bloat.
* **Real-Time Diagnostics & Diagnostics Console**: Interactive terminal feedback displaying step-by-step progress, ETA calculations, speed metrics, and direct output piping from active subprocess streams.

---

## 2. Prerequisites & Installation

### Step 1: Clone the Repository
Open your preferred terminal (PowerShell, Command Prompt, or Git Bash) and execute:
```bash
git clone https://github.com/YOUR_USERNAME/universal-video-downloader.git
cd universal-video-downloader
```

### Step 2: Install Python Dependencies
The backend requires Python 3.8+ along with several critical libraries for packaging, networking, and UI rendering. Install them all via `pip`:
```bash
pip install -r requirements.txt
```
*If a `requirements.txt` file is not present, you can install the packages individually:*
```bash
pip install yt-dlp customtkinter requests
```

---

### CRITICAL REQUIREMENT: FFmpeg & NVIDIA NVENC Setup
This application **requires** `FFmpeg` compiled with NVIDIA hardware acceleration enablement (`--enable-nvenc`). Without FFmpeg registered in your operating system, the application will fail during stream merging and subtitle burn-in.

#### A. Download FFmpeg for Windows
1. Go to the official [FFmpeg Downloads page](https://ffmpeg.org/download.html) or direct your browser to the trusted [BGy社 FFmpeg builds repository](https://www.gyan.dev/ffmpeg/builds/).
2. Download the **ffmpeg-git-full.7z** or **ffmpeg-release-essentials.zip** archive.
3. Extract the downloaded folder to a permanent location on your machine (e.g., `C:\Program Files\ffmpeg` or `C:\ffmpeg`).

#### B. Configure Windows System PATH
You must register the `bin` directory of your extracted FFmpeg files within the Windows Environment Variables:
1. Press the **Windows Key**, search for **"Edit the system environment variables"**, and press Enter.
2. In the System Properties window, click the **Environment Variables...** button near the bottom right.
3. Under **System variables** (or User variables), locate the variable named **`Path`**, select it, and click **Edit...**.
4. Click **New** on the right side, and paste the absolute path to your FFmpeg `bin` folder (e.g., `C:\ffmpeg\bin` or `C:\Program Files\ffmpeg\bin`).
5. Click **OK** on all open windows to save the changes.
6. Open a **new** Command Prompt or PowerShell window and verify the installation by typing:
   ```cmd
   ffmpeg -version
   ```
   *Verify that the output mentions `cuda` and `nvenc` as supported hardware acceleration libraries.*

---

## 3. How to Run (Desktop GUI Mode)

The Desktop GUI is built on the premium, modern `customtkinter` framework, styled with a sophisticated deep-dark slate canvas and terminal aesthetics.

To launch the desktop application, run:
```bash
python downloader.py
```

### GUI Features & Design:
* **Compact High-Density Layout**: Optimized input fields, dropdown menus, and segmentation tabs compiled neatly to fit high-DPI displays.
* **Integrated Percentage Panel**: A physical percentage readout running alongside a smooth linear progress bar.
* **Retro-Console Logger**: A read-only black textbox with hacker-green Courier typography, piping real-time `stdout` and `stderr` streams directly from underlying processes.

---

## 4. How to Run (Web Access Mode)

For users who prefer operating the downloader through a web browser, the system features an adaptive web app.

To launch the web backend server:
```bash
npm run dev
```
Once the dev server is active, open your browser and navigate to:
```
http://localhost:3000
```

### Web Interface Highlights:
* **Interactive Logger Console**: Mimics the desktop interface's live logging with color-coded warning/system levels.
* **Reactive Layout**: Adapts gracefully across desktop browsers, tablets, and mobile devices, preserving container structures.
* **Instantaneous UI State Rendering**: Built with high-performance React hooks for rapid feedback during metadata query operations.

---

## 5. Feature Guide / How to Use

Follow this step-by-step workflow to execute an accelerated video extraction task:

### Step 1: Input URL and Fetch Formats
1. Copy the source link of the video stream (e.g., YouTube URL or raw `.m3u8` playlist address).
2. Paste the address into the **Video / Stream / HLS URL** entry field.
3. Click **Fetch Video Formats**.
4. The system will query the remote servers, display the video's human-readable title, and populate the quality selection dropdown with all available resolutions (ranging from standard definition up to 4K/8K options).

### Step 2: Handle Subtitles (Optional)
If your video requires subtitle integration:
1. Paste the link to the subtitle file into the **Subtitle URL** field. This downloader supports direct links as well as complex dynamic parameters (like web PHP redirects).
2. Click **Verify Subtitle** to pull the headers, sanitize the timestamps, and ensure a correct WebVTT or SRT format structure is present.

### Step 3: Select Subtitle Processing Mode
Choose how the subtitle track should be merged with the video:
* **Softsub (Fast Remux)**: 
  * Select this mode if you want the subtitles to be embedded as an optional toggleable stream inside the file.
  * Very fast (takes ~2 seconds).
  * Output container is `.mkv`.
* **Hardsub (Burn-in Re-encode)**:
  * Select this mode if you want the subtitles permanently burned directly into the video frames (highly recommended for compatibility on players that do not support soft subtitles).
  * Uses your dedicated NVIDIA GPU (`h264_nvenc`) with CUDA hardware acceleration for high-speed rendering.
  * Output container is `.mp4`.

### Step 4: Configure the Hardsub Video Bitrate
When utilizing **Hardsub Mode**, you can customize the target bitrate to prevent quality loss or file size bloat:
1. Locate the **Hardsub Video Bitrate** field (default is set to `1300k`).
2. Adjust the string value based on your requirements (e.g., set to `2000k` for high-motion 1080p, or `4000k` for crisp 1440p/4K streams).
3. The underlying FFmpeg process will map this value strictly into `-b:v` and `-maxrate`, while dynamically doubling it to calculate the optimal visual look-ahead buffer stream (e.g., `-bufsize 2600k`).

### Step 5: Execute and Monitor
1. *(Optional)* Input a custom file name into the **Custom Filename** entry to override the default title-based naming.
2. Click **Download**.
3. Watch the progress update in real-time. The progress bar and percentage label will track download chunks.
4. During the FFmpeg remuxing or burn-in phase, the live terminal log at the bottom will display exact frames processed, current encoding speed (e.g., `5.4x` real-time), and exact elapsed timestamp indicators.
