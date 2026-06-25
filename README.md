# 🚀 Universal Video Downloader (Full-Stack Edition)

A high-performance, universal video downloader built with a dual-interface architecture (Desktop GUI & Web App). Powered by `yt-dlp` for extraction and `FFmpeg` with **NVIDIA CUDA/NVENC** hardware acceleration for lightning-fast post-processing and subtitle burn-in.

---

## ✨ Core Features
* **Universal Extraction:** Download from YouTube, raw HLS/`.m3u8` streams, and hundreds of other non-DRM platforms.
* **Smart Subtitle Handling:** Automatically fetch, validate, and convert dynamic web subtitle endpoints (e.g., PHP URLs) into WebVTT.
* **Hardware-Accelerated Post-Processing:**
  * **Softsub:** Instantaneous remuxing to `.mkv`.
  * **Hardsub:** Burn-in re-encoding to `.mp4` utilizing your NVIDIA GPU (NVENC) with customizable Target Bitrate constraints to prevent file size bloat.
* **Dual Interfaces:** Choose between a lightweight `CustomTkinter` Desktop GUI or a modern `React/Vite` Web Application.

---

## 🛠️ Prerequisites & Installation

Before running the application, ensure your system meets the following requirements:
1.  **Python 3.8+** installed.
2.  **Node.js & npm** installed (Required for the Web UI).
3.  **FFmpeg:** **[CRITICAL]** You MUST have FFmpeg installed and added to your Windows System PATH. The app relies on it for media multiplexing.
4.  **NVIDIA GPU:** Required for the hardware-accelerated Hardsub feature.

### Step-by-Step Setup
Clone this repository to your local machine, then open your terminal in the project directory:

**1. Install Python Backend Dependencies:**
```bash
pip install flask yt-dlp requests customtkinter
```

**2. Install Node.js Frontend Dependencies:**
```bash
npm install
```

---

## 🔌 Architecture: How the Web API Bridge Works
The modern Web GUI uses a seamless Full-Stack approach to communicate with the Python engine. We upgraded the action buttons (`onClick`) to automatically route requests based on mode selections:

* **Fetch Formats:** Uses an async handler pointing to `http://localhost:5000/api/fetch` to query available qualities from standard extractors.
* **Verify Subtitles:** Validates subtitles on-the-fly via `/api/verify_subtitle` and generates the `temp_subs.vtt` source format on the server side.
* **Download:** Spawns an `EventSource` listening on `http://localhost:5000/api/download`. Real-time event messages (`data.type === 'log'`, `'progress'`, `'status'`, `'complete'`) are cleanly converted to state objects so that your linear progress bar and terminal textbox reflect actual live processing speeds (e.g., CUDA speed multipliers and real video frame indices)!

---

## 🚀 Running Your Complete Setup
You can run this project in two different modes depending on your preference.

### Option A: Web App Mode (React + Flask)
To put the new full-stack architecture into action, you need to start both the engine and the interface.

1. **Start the API Backend Server:** Open a terminal and run your local Python bridge:
   ```bash
   python app.py
   ```
   *(This will start the Flask server, usually on port 5000).*

2. **Start the React Web GUI:** Open a second terminal window and boot up your web client:
   ```bash
   npm run dev
   ```
   *(Note: For the shared development sandbox, the frontend runs on port 3000).*

3. **Trigger Real Downloads:**
   * Open your browser to the local web interface (e.g., `http://localhost:3000`).
   * Switch the **API Connection Mode** toggle at the top of the UI from **🔌 Simulator** to **⚡ Live API Server**.
   * Paste a stream URL, click **Fetch Video Formats**, select your subtitles and target bitrate, and hit **Download**!

### Option B: Desktop GUI Mode (Standalone)
If you prefer not to spin up the web server, you can use the standalone Python desktop application. Run this command in your terminal:
```bash
python downloader.py
```
*(This launches the CustomTkinter dashboard, integrating yt-dlp and FFmpeg directly without needing a browser).*
