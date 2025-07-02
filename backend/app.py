import random
import json
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- Konfigurasi Aplikasi Flask & Database ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
DB_FILE = "scenarios_db.json"

# --- Fungsi Helper untuk Database JSON ---
def load_db():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)


# ====================================================================
# KELAS-KELAS SIMULASI
# ====================================================================
class Mobil:
    def __init__(self, id_mobil, tipe_pembayaran, waktu_kedatangan):
        self.id = id_mobil
        self.tipe_pembayaran = tipe_pembayaran
        self.waktu_kedatangan = waktu_kedatangan
        self.waktu_tunggu = 0

class GarduTol:
    def __init__(self, id_gardu):
        self.id = id_gardu
        self.status = 'bebas'
        self.mobil_dilayani = None
        self.waktu_selesai_layanan = -1
        self.total_waktu_sibuk = 0

    def layani(self, mobil, waktu_sekarang): raise NotImplementedError
    def bisa_melayani(self, mobil): raise NotImplementedError
    def update_status(self, waktu_sekarang):
        if self.status == 'sibuk':
            self.total_waktu_sibuk += 1
        if self.status == 'sibuk' and waktu_sekarang >= self.waktu_selesai_layanan:
            selesai = self.mobil_dilayani
            self.status = 'bebas'
            self.mobil_dilayani = None
            return selesai
        return None

class GarduOtomatis(GarduTol):
    WAKTU_LAYANAN = 3
    def bisa_melayani(self, mobil): return mobil.tipe_pembayaran == 'e-money'
    def layani(self, mobil, waktu_sekarang):
        if self.bisa_melayani(mobil):
            self.status = 'sibuk'; self.mobil_dilayani = mobil
            self.waktu_selesai_layanan = waktu_sekarang + self.WAKTU_LAYANAN

class GarduManual(GarduTol):
    WAKTU_LAYANAN_MIN, WAKTU_LAYANAN_MAX = 7, 12
    def bisa_melayani(self, mobil): return True
    def layani(self, mobil, waktu_sekarang):
        self.status = 'sibuk'; self.mobil_dilayani = mobil
        waktu_layanan_acak = random.randint(self.WAKTU_LAYANAN_MIN, self.WAKTU_LAYANAN_MAX)
        self.waktu_selesai_layanan = waktu_sekarang + waktu_layanan_acak

class Simulator:
    def __init__(self, config):
        self.config = config; self.list_gardu = []; self.antrean_mobil = []
        self.mobil_selesai = []; self.id_mobil_terakhir = 0; self.history = []
        self.panjang_antrean_maks = 0
        id_gardu_counter = 1
        for _ in range(config['garduOtomatis']): self.list_gardu.append(GarduOtomatis(f"GTO-{id_gardu_counter}")); id_gardu_counter += 1
        for _ in range(config['garduManual']): self.list_gardu.append(GarduManual(f"MANUAL-{id_gardu_counter}")); id_gardu_counter += 1

    def run(self):
        pola_trafik = self.config.get("polaTrafik", "stabil")
        durasi_total = self.config['durasiSimulasiDetik']

        for waktu in range(durasi_total):
            log_event = None
            mobil_per_menit_saat_ini = self.config['mobilPerMenit']

            if pola_trafik == "jam_sibuk":
                if (waktu < durasi_total * 0.25) or (waktu > durasi_total * 0.75):
                    mobil_per_menit_saat_ini *= 2
                else:
                    mobil_per_menit_saat_ini /= 2

            if mobil_per_menit_saat_ini > 0:
                detik_per_mobil = 60.0 / mobil_per_menit_saat_ini
                if random.random() < 1.0 / detik_per_mobil:
                    self.id_mobil_terakhir += 1
                    tipe = 'e-money' if random.randint(1, 100) <= self.config['persentaseEToll'] else 'tunai'
                    self.antrean_mobil.append(Mobil(self.id_mobil_terakhir, tipe, waktu))
                    log_event = f"Mobil #{self.id_mobil_terakhir} ({tipe}) masuk antrean."

            for gardu in self.list_gardu:
                mobil_yang_selesai = gardu.update_status(waktu)
                if mobil_yang_selesai:
                    mobil_yang_selesai.waktu_tunggu = waktu - mobil_yang_selesai.waktu_kedatangan
                    self.mobil_selesai.append(mobil_yang_selesai)
                    if not log_event:
                        log_event = f"{gardu.id} selesai melayani Mobil #{mobil_yang_selesai.id}."

            # --- PERBAIKAN LOGIKA ---
            # Acak urutan gardu agar distribusi lebih merata
            gardu_cek_acak = self.list_gardu[:]
            random.shuffle(gardu_cek_acak)
            
            for gardu in gardu_cek_acak:
                if gardu.status == 'bebas' and self.antrean_mobil:
                    for i, mobil in enumerate(self.antrean_mobil):
                        if gardu.bisa_melayani(mobil):
                            mobil_terpilih = self.antrean_mobil.pop(i); gardu.layani(mobil_terpilih, waktu); break
            
            self.panjang_antrean_maks = max(self.panjang_antrean_maks, len(self.antrean_mobil))

            snapshot = { "waktu": waktu, "panjangAntrean": len(self.antrean_mobil), "statusGardu": [{'id': g.id, 'status': g.status, 'mobil_dilayani': g.mobil_dilayani.__dict__ if g.mobil_dilayani else None} for g in self.list_gardu], "totalSelesai": len(self.mobil_selesai), "event": log_event }
            self.history.append(snapshot)

        total_waktu_tunggu = sum(m.waktu_tunggu for m in self.mobil_selesai)
        rata_rata_waktu_tunggu = total_waktu_tunggu / len(self.mobil_selesai) if self.mobil_selesai else 0
        waktu_tunggu_maks = max(m.waktu_tunggu for m in self.mobil_selesai) if self.mobil_selesai else 0
        
        utilisasi_gardu = []
        if durasi_total > 0:
            for gardu in self.list_gardu:
                persentase_sibuk = (gardu.total_waktu_sibuk / durasi_total) * 100
                utilisasi_gardu.append({"id": gardu.id, "utilization": round(persentase_sibuk, 2)})

        return {
            "history": self.history,
            "statistikAkhir": {
                "totalMobilDilayani": len(self.mobil_selesai),
                "rataRataWaktuTunggu": round(rata_rata_waktu_tunggu, 2),
                "waktuTungguMaks": waktu_tunggu_maks,
                "panjangAntreanMaks": self.panjang_antrean_maks,
                "utilisasiGardu": utilisasi_gardu
            }
        }

# ====================================================================
# BAGIAN API ENDPOINT
# ====================================================================
@app.route('/api/simulate', methods=['POST'])
def simulate():
    config = request.json; simulator = Simulator(config); hasil = simulator.run(); return jsonify(hasil)
@app.route('/api/scenarios', methods=['GET'])
def get_scenarios():
    scenarios = load_db(); return jsonify(scenarios)
@app.route('/api/scenarios', methods=['POST'])
def save_scenario():
    new_scenario = request.json; scenarios = load_db(); scenarios.append(new_scenario)
    save_db(scenarios); return jsonify({"status": "sukses", "data": new_scenario}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)
