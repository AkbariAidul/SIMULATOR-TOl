Ini adalah proyek UAS (Ujian Akhir Semester) untuk mata kuliah **Struktur Data** dan **Pemrograman Berorientasi Objek (PBO)**. Proyek ini merupakan aplikasi web full-stack untuk mensimulasikan dan menganalisis sistem antrean di gerbang tol.

Aplikasi ini dibangun untuk memvisualisasikan bagaimana berbagai parameter seperti jumlah gardu, kepadatan lalu lintas, dan pola kedatangan kendaraan dapat mempengaruhi efisiensi gerbang tol, seperti waktu tunggu rata-rata dan panjang antrean.

---

## 🚀 Fitur Utama

* **Visualisasi Real-time:** Tampilan visual "Blueprint Malam Hari" yang imersif dengan animasi mobil yang masuk, mengantre di jalurnya masing-masing, dan melewati gardu tol.
* **Simulasi Dinamis:** Logika simulasi di backend yang mencakup berbagai parameter:
    * Jumlah Gardu Otomatis (GTO) & Manual.
    * Kepadatan Lalu Lintas (mobil per menit).
    * Persentase Pengguna E-Toll.
    * Pola Trafik (Stabil atau Jam Sibuk).
* **Analisis Statistik:** Setelah simulasi selesai, aplikasi menyajikan laporan analisis yang detail, termasuk:
    * Grafik dinamis panjang antrean vs. waktu.
    * Rata-rata & waktu tunggu terlama.
    * Panjang antrean maksimal.
    * Tingkat kesibukan (utilisasi) untuk setiap gardu.
* **Manajemen Skenario:** Kemampuan untuk menyimpan konfigurasi simulasi yang kompleks ke dalam sebuah file `database.json` di server dan memuatnya kembali untuk pengujian berulang.
* **Live Event Log:** Panel log yang melaporkan setiap kejadian penting dalam simulasi secara *real-time*.

---

## 🛠️ Teknologi yang Digunakan

* **Frontend:**
    * **React.js:** Untuk membangun antarmuka pengguna yang interaktif dan dinamis.
    * **Tailwind CSS (via CDN):** Untuk styling yang cepat dan modern.
    * **Recharts:** Library untuk membuat grafik statistik yang indah.
    * **React Hot Toast:** Untuk notifikasi yang profesional.
* **Backend:**
    * **Flask (Python):** Sebagai web server dan penyedia API untuk menjalankan logika simulasi.
    * **Penerapan PBO:** Desain sistem menggunakan kelas-kelas seperti `Simulator`, `GarduTol`, `GarduOtomatis`, `GarduManual`, dan `Mobil` untuk menerapkan konsep Enkapsulasi, Inheritance, dan Polimorfisme.
* **Database:**
    * **JSON:** Digunakan sebagai database file yang sederhana dan persisten untuk menyimpan dan memuat skenario simulasi.
* **Struktur Data & Algoritma:**
    * **Antrean (Queue):** Diimplementasikan menggunakan `list` Python untuk mengelola mobil yang menunggu (prinsip FIFO).
    * **Distribusi Acak:** Menggunakan `random.shuffle` untuk memastikan distribusi mobil ke gardu yang bebas lebih adil dan realistis.

---

## 📖 Cara Menjalankan Proyek

1.  **Clone repository ini:**
    ```bash
    git clone [URL_REPOSITORY]
    cd [NAMA_FOLDER_PROYEK]
    ```

2.  **Setup & Jalankan Backend:**
    ```bash
    cd backend
    python -m venv venv
    # Aktifkan virtual environment
    # Windows:
    .\venv\Scripts\activate
    # MacOS/Linux:
    source venv/bin/activate
    pip install -r requirements.txt # Anda perlu membuat file requirements.txt
    flask run
    ```
    *Catatan: Buat `requirements.txt` dengan `pip freeze > requirements.txt` setelah menginstall `Flask` dan `Flask-CORS`.*

3.  **Setup & Jalankan Frontend:**
    Buka terminal baru.
    ```bash
    cd frontend
    npm install
    npm install recharts react-hot-toast react-icons
    npm start
    ```

4.  Buka browser dan akses `http://localhost:3000`.

---

## 👥 Anggota Kelompok

* **[Aidul Akbari]**
* **[Iqbal Rupawan]**
* **[Muhammad Basirun Arafi]**
* **[Halimatus Sa'diah]**
* **[Lailatul Mubarokah]**
