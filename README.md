# 🚀 Universal Video Downloader (Full-Stack Edition)

Choose your language / Pilih bahasa Anda:
* [🇬🇧 English Documentation](#-english-documentation)
* [🇮🇩 Dokumentasi Bahasa Indonesia](#-dokumentasi-bahasa-indonesia)

---

## 🇬🇧 English Documentation

A high-performance, universal video downloader built with a dual-interface architecture (Desktop GUI & Web App). Powered by `yt-dlp` for extraction and `FFmpeg` with **NVIDIA CUDA/NVENC** hardware acceleration for lightning-fast post-processing and subtitle burn-in.

### ✨ Core Features
* **Universal Extraction:** Download from YouTube, raw HLS/`.m3u8` streams, and hundreds of other non-DRM platforms.
* **Smart Subtitle Handling:** Automatically fetch, validate, and convert dynamic web subtitle endpoints (e.g., PHP URLs) into WebVTT.
* **Hardware-Accelerated Post-Processing:**
  * **Softsub:** Instantaneous remuxing to `.mkv`.
  * **Hardsub:** Burn-in re-encoding to `.mp4` utilizing your NVIDIA GPU (NVENC) with customizable Target Bitrate constraints to prevent file size bloat.
* **Dual Interfaces:** Choose between a lightweight `CustomTkinter` Desktop GUI or a modern `React/Vite` Web Application.

---

### 🛠️ Prerequisites & Installation

Before running the application, ensure your system meets the following requirements:
1.  **Python 3.8+** installed.
2.  **Node.js & npm** installed (Required for the Web UI).
3.  **FFmpeg:** **[CRITICAL]** You MUST have FFmpeg installed and added to your Windows System PATH. The app relies on it for media multiplexing.
4.  **NVIDIA GPU:** Required for the hardware-accelerated Hardsub feature.

#### Step-by-Step Setup
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

### 🔌 Architecture: How the Web API Bridge Works
The modern Web GUI uses a seamless Full-Stack approach to communicate with the Python engine. We upgraded the action buttons (`onClick`) to automatically route requests based on mode selections:

* **Fetch Formats:** Uses an async handler pointing to `http://localhost:5000/api/fetch` to query available qualities from standard extractors.
* **Verify Subtitles:** Validates subtitles on-the-fly via `/api/verify_subtitle` and generates the `temp_subs.vtt` source format on the server side.
* **Download:** Spawns an `EventSource` listening on `http://localhost:5000/api/download`. Real-time event messages (`data.type === 'log'`, `'progress'`, `'status'`, `'complete'`) are cleanly converted to state objects so that your linear progress bar and terminal textbox reflect actual live processing speeds (e.g., CUDA speed multipliers and real video frame indices)!

---

### 🚀 Running Your Complete Setup
You can run this project in two different modes depending on your preference.

#### Option A: Web App Mode (React + Flask)
To put the new full-stack architecture into action, you need to start both the engine and the interface.

* **🚀 Easiest Method (Windows Shortcut):**
  Just double-click **`Run_Web.bat`** in the project folder. This automatically verifies your Python & Node.js environment, and spins up both the Flask backend server and Vite frontend client in separate terminal windows simultaneously!

* **💻 Manual Alternative (Cross-Platform Fallback):**
  If you are on Mac/Linux or prefer manual controls, open two separate terminal windows and run:
  
  **Terminal 1 (Backend API):**
  ```bash
  python app.py
  ```
  *(Starts the Flask server listening on port 5000)*

  **Terminal 2 (Frontend React):**
  ```bash
  npm run dev
  ```
  *(Note: For the shared development sandbox, the frontend runs on port 3000)*

* **🎯 Triggering Downloads:**
  1. Open your browser to the local web interface (e.g., `http://localhost:3000`).
  2. Switch the **API Connection Mode** toggle at the top of the UI from **🔌 Simulator** to **⚡ Live API Server**.
  3. Paste a stream URL, click **Fetch Video Formats**, select your subtitles and target bitrate, and hit **Download**!

#### Option B: Desktop GUI Mode (Standalone)
If you prefer not to spin up the web server, you can use the standalone Python desktop application.

* **🚀 Easiest Method (Windows Shortcut):**
  Just double-click **`Run_Desktop.bat`** in the project folder to launch the standalone desktop GUI instantly.

* **💻 Manual Alternative (Cross-Platform Fallback):**
  Open your terminal and execute:
  ```bash
  python downloader.py
  ```
  *(This launches the CustomTkinter dashboard, integrating yt-dlp and FFmpeg directly without needing a browser).*

---

## 🇮🇩 Dokumentasi Bahasa Indonesia

Pengunduh video universal berkinerja tinggi yang dibuat dengan arsitektur antarmuka ganda (Desktop GUI & Aplikasi Web). Didukung oleh `yt-dlp` untuk ekstraksi video dan `FFmpeg` dengan akselerasi perangkat keras **NVIDIA CUDA/NVENC** untuk pasca-pemrosesan super cepat dan penempelan subtitle secara permanen (hardsub).

### ✨ Fitur Utama
* **Ekstraksi Universal:** Unduh dari YouTube, streaming HLS/`.m3u8` mentah, dan ratusan platform non-DRM lainnya.
* **Penanganan Subtitle Cerdas:** Mengambil, memvalidasi, dan mengonversi endpoint subtitle web dinamis secara otomatis (misalnya, URL PHP) menjadi WebVTT.
* **Pasca-Pemrosesan Berakselerasi Perangkat Keras:**
  * **Softsub:** Penggabungan instan (remuxing) ke format `.mkv` tanpa penurunan kualitas video.
  * **Hardsub:** Melakukan re-encode video langsung ke format `.mp4` dengan menempelkan subtitle secara permanen menggunakan GPU NVIDIA Anda (NVENC). Dilengkapi batas Bitrate Target yang dapat disesuaikan untuk mencegah pembengkakan ukuran file.
* **Antarmuka Ganda:** Pilih antara aplikasi Desktop GUI yang ringan menggunakan `CustomTkinter` atau Aplikasi Web modern berbasis `React/Vite`.

---

### 🛠️ Prasyarat & Instalasi

Sebelum menjalankan aplikasi, pastikan sistem Anda memenuhi persyaratan berikut:
1.  **Python 3.8+** telah terinstal.
2.  **Node.js & npm** telah terinstal (Diperlukan untuk Web UI).
3.  **FFmpeg:** **[KRITIS]** Anda HARUS menginstal FFmpeg dan memasukkannya ke dalam Windows System PATH. Aplikasi ini sangat bergantung pada FFmpeg untuk menggabungkan media.
4.  **GPU NVIDIA:** Diperlukan khusus untuk fitur Hardsub dengan akselerasi perangkat keras.

#### Langkah-Langkah Penyiapan
Kloning repositori ini ke komputer lokal Anda, lalu buka terminal di direktori proyek:

**1. Instal Dependensi Python Backend:**
```bash
pip install flask yt-dlp requests customtkinter
```

**2. Instal Dependensi Node.js Frontend:**
```bash
npm install
```

---

### 🔌 Arsitektur: Cara Kerja Jembatan API Web
Web GUI modern menggunakan pendekatan Full-Stack yang mulus untuk berkomunikasi dengan mesin Python. Kami telah memperbarui fungsi tombol tindakan (`onClick`) untuk merutekan permintaan secara otomatis berdasarkan mode yang dipilih:

* **Fetch Formats (Ambil Format):** Menggunakan handler asinkron yang mengarah ke `http://localhost:5000/api/fetch` untuk meminta kualitas video yang tersedia dari ekstraktor standar.
* **Verify Subtitles (Verifikasi Subtitle):** Memvalidasi subtitle secara langsung via `/api/verify_subtitle` dan menghasilkan file format sumber `temp_subs.vtt` di sisi server.
* **Download (Unduh):** Menjalankan `EventSource` yang mendengarkan ke `http://localhost:5000/api/download`. Pesan peristiwa real-time (`data.type === 'log'`, `'progress'`, `'status'`, `'complete'`) dikonversi secara bersih ke objek state sehingga progress bar linier dan kotak teks terminal Anda dapat menampilkan kecepatan pemrosesan langsung yang sebenarnya (seperti kecepatan pengkodean CUDA dan indeks bingkai video asli)!

---

### 🚀 Cara Menjalankan Setup Lengkap
Anda dapat menjalankan proyek ini dalam dua mode berbeda sesuai dengan preferensi Anda.

#### Opsi A: Mode Aplikasi Web (React + Flask)
Untuk menggunakan arsitektur full-stack baru ini, Anda perlu menjalankan mesin backend dan antarmuka frontend secara bersamaan.

* **🚀 Metode Termudah (Shortcut Windows):**
  Cukup klik dua kali file **`Run_Web.bat`** di dalam folder proyek. File ini akan secara otomatis memeriksa lingkungan Python & Node.js Anda, lalu membuka server backend Flask dan klien frontend React secara bersamaan dalam dua jendela Command Prompt terpisah!

* **💻 Metode Alternatif Manual (Pencadangan Lintas Platform):**
  Jika Anda menggunakan macOS/Linux atau ingin menjalankannya secara manual, buka dua jendela terminal baru dan jalankan:
  
  **Terminal 1 (Backend API):**
  ```bash
  python app.py
  ```
  *(Memulai server Flask pada port 5000)*

  **Terminal 2 (Frontend React):**
  ```bash
  npm run dev
  ```
  *(Catatan: Untuk lingkungan pengembangan sandbox, frontend berjalan pada port 3000)*

* **🎯 Mulai Mengunduh Video:**
  1. Buka browser Anda dan akses antarmuka web lokal (misalnya, `http://localhost:3000`).
  2. Ubah tombol **API Connection Mode** di bagian atas UI dari **🔌 Simulator** ke **⚡ Live API Server**.
  3. Tempelkan URL video, klik **Fetch Video Formats**, pilih file subtitle dan target bitrate Anda, lalu klik tombol **Download**!

#### Opsi B: Mode Desktop GUI (Mandiri)
Jika Anda tidak ingin menjalankan server web, Anda dapat menggunakan aplikasi desktop Python mandiri secara langsung.

* **🚀 Metode Termudah (Shortcut Windows):**
  Cukup klik dua kali file **`Run_Desktop.bat`** di dalam folder proyek untuk langsung memicu dasbor CustomTkinter mandiri secara cepat.

* **💻 Metode Alternatif Manual (Pencadangan Lintas Platform):**
  Buka jendela terminal baru Anda dan jalankan:
  ```bash
  python downloader.py
  ```
  *(Perintah ini akan membuka dasbor CustomTkinter yang mengintegrasikan yt-dlp dan FFmpeg secara langsung tanpa memerlukan browser).*
