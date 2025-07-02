// frontend/src/App.js

import React, { useState, useEffect, useMemo, useRef } from 'react';
// Import library dan ikon yang dibutuhkan
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { FaRoad, FaPlay, FaSave, FaFolderOpen, FaChartLine, FaListAlt, FaFileContract } from 'react-icons/fa';

// ====================================================================
// KOMPONEN VISUAL AKHIR
// ====================================================================

const Stars = () => (
  <div className="absolute top-0 left-0 w-full h-full">
    {[...Array(50)].map((_, i) => (
      <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 2 + 1}px`,
        height: `${Math.random() * 2 + 1}px`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: '5s',
      }}></div>
    ))}
  </div>
);

const PalangGerbang = ({ terbuka }) => (
  <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-14 bg-gray-200 rounded-full origin-bottom transition-transform duration-500 ease-in-out shadow-lg ${terbuka ? 'rotate-[80deg]' : 'rotate-0'}`}>
    <div className="absolute top-1/4 w-full h-1.5 bg-red-500 rounded-full"></div>
  </div>
);

const GarduTol = ({ gardu }) => {
  const isSibuk = gardu.status === 'sibuk';
  const statusColor = isSibuk ? 'border-orange-400' : 'border-green-400';
  const statusGlow = isSibuk ? 'shadow-[0_0_12px_#fb923c]' : 'shadow-[0_0_12px_#4ade80]';

  return (
    <div className="relative flex flex-col items-center">
      <div className={`absolute -top-4 w-4 h-4 rounded-full border-2 ${statusColor} ${statusGlow} transition-all`}></div>
      <div className="relative w-24 h-16 bg-gray-800 bg-opacity-80 rounded-t-md border-t-2 border-x-2 border-cyan-400 border-opacity-50 shadow-lg flex flex-col justify-end items-center p-1">
        <PalangGerbang terbuka={isSibuk} />
        <p className="font-mono text-xs text-cyan-300 tracking-wider">{gardu.id}</p>
      </div>
      <div className="w-32 h-6 bg-gray-900 border-2 border-t-0 border-gray-700 rounded-b-md"></div>
    </div>
  );
};

const CarSvg = ({ color }) => (
    <svg width="28" height="56" viewBox="0 0 50 100" className="drop-shadow-lg">
        <path d="M5,15 A15,15 0 0,1 45,15 L45,85 A15,15 0 0,1 5,85 Z" fill={color} stroke="#9ca3af" strokeWidth="2"/>
        <rect x="10" y="25" width="30" height="50" rx="5" fill="#030712" fillOpacity="0.5"/>
        <rect x="18" y="5" width="14" height="5" fill="#facc15" className="shadow-[0_0_10px_#facc15]"/>
        <rect x="18" y="90" width="14" height="5" fill="#ef4444" className="shadow-[0_0_10px_#ef4444]"/>
    </svg>
);

const MobilAntre = ({ position, carData, isLeaving }) => (
  <div
    className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 ease-in-out ${carData.isNew ? 'animate-drive-in' : ''} ${isLeaving ? 'animate-drive-through' : ''}`}
    style={{ bottom: `${20 + position * 60}px` }}
  >
    <CarSvg color={carData.color} />
  </div>
);

// --- PERBAIKAN: Komponen CarLane yang hilang ditambahkan kembali ---
const CarLane = ({ cars, gardu }) => (
  <div className="relative h-full w-32 flex flex-col items-center">
    {/* Gardu di atas */}
    <div className="absolute top-0 z-10">
      <GarduTol gardu={gardu} />
    </div>
    {/* Mobil di jalur */}
    <div className="absolute top-24 w-full h-[calc(100%-6rem)]">
      {cars.map((car, index) => (
        <MobilAntre key={car.id} position={index} carData={car} isLeaving={car.isLeaving} />
      ))}
    </div>
  </div>
);

// ====================================================================
// KOMPONEN UTAMA APLIKASI
// ====================================================================
function App() {
  const [config, setConfig] = useState({ garduOtomatis: 3, garduManual: 2, mobilPerMenit: 45, persentaseEToll: 85, durasiSimulasiDetik: 300, polaTrafik: 'stabil' });
  const [simulationResult, setSimulationResult] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState("");
  const [chartData, setChartData] = useState([]);
  const [eventLog, setEventLog] = useState([]);
  
  const [laneQueues, setLaneQueues] = useState({});
  const nextCarId = useRef(0);
  const carColors = ['#e53e3e', '#38a169', '#3182ce', '#d69e2e', '#805ad5', '#d53f8c', '#d1d5db'];

  const garduLayout = useMemo(() => {
    const layout = [];
    for (let i = 0; i < config.garduOtomatis; i++) layout.push({ id: `GTO-${i + 1}`, status: 'bebas', mobil_dilayani: null });
    for (let i = 0; i < config.garduManual; i++) layout.push({ id: `MANUAL-${i + 1 + config.garduOtomatis}`, status: 'bebas', mobil_dilayani: null });
    return layout;
  }, [config.garduOtomatis, config.garduManual]);

  useEffect(() => {
    const initialQueues = {};
    garduLayout.forEach(g => initialQueues[g.id] = []);
    setLaneQueues(initialQueues);
  }, [garduLayout]);

  useEffect(() => { fetch('http://localhost:5000/api/scenarios').then(res => res.json()).then(data => setSavedScenarios(data || [])).catch(err => console.error("Gagal memuat skenario:", err)); }, []);
  const handleSaveScenario = async () => { if (!scenarioName) { toast.error("Silakan beri nama skenario."); return; } const newScenario = { name: scenarioName, config }; toast.promise(fetch('http://localhost:5000/api/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newScenario) }).then(response => { if (!response.ok) throw new Error('Gagal menyimpan.'); setSavedScenarios(prev => [...prev, newScenario]); setScenarioName(""); return `Skenario "${scenarioName}" disimpan!`; }), { loading: 'Menyimpan...', success: (msg) => msg, error: 'Gagal menyimpan skenario.' }); };
  const handleLoadScenario = (scenario) => { setConfig(scenario.config); toast.success(`Skenario "${scenario.name}" dimuat.`); };
  const handleConfigChange = (e) => { setConfig({ ...config, [e.target.name]: e.target.type === 'range' ? parseInt(e.target.value, 10) : e.target.value }); };
  const startSimulation = async () => { setIsLoading(true); setSimulationResult(null); setCurrentFrame(0); setChartData([]); setEventLog([]); const initialQueues = {}; garduLayout.forEach(g => initialQueues[g.id] = []); setLaneQueues(initialQueues); nextCarId.current = 0; try { const response = await fetch('http://localhost:5000/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config), }); const data = await response.json(); setSimulationResult(data); setIsPlaying(true); toast.success('Simulasi dimulai!'); } catch (error) { toast.error("Gagal terhubung ke backend."); } finally { setIsLoading(false); } };
  
  useEffect(() => {
    if (!isPlaying || !simulationResult) return;
    const timer = setInterval(() => { setCurrentFrame(prev => { if (prev >= simulationResult.history.length - 1) { setIsPlaying(false); toast.success('Simulasi selesai!'); return prev; } return prev + 1; }); }, 200);
    return () => clearInterval(timer);
  }, [isPlaying, simulationResult]);

  useEffect(() => {
    if (currentFrame === 0 || !simulationResult) return;
    const prevHistory = simulationResult.history[currentFrame - 1];
    const currentHistory = simulationResult.history[currentFrame];
    
    const totalCarsBefore = prevHistory.panjangAntrean + prevHistory.statusGardu.filter(g => g.status === 'sibuk').length;
    const totalCarsNow = currentHistory.panjangAntrean + currentHistory.statusGardu.filter(g => g.status === 'sibuk').length;

    if (totalCarsNow > totalCarsBefore) {
      const newCar = { id: nextCarId.current++, color: carColors[Math.floor(Math.random() * carColors.length)], isNew: true };
      const queues = Object.values(laneQueues);
      const shortestQueue = queues.reduce((shortest, current) => current.length < shortest.length ? current : shortest, queues[0] || []);
      const shortestQueueKey = Object.keys(laneQueues).find(key => laneQueues[key] === shortestQueue);
      if (shortestQueueKey) {
        setLaneQueues(prev => ({ ...prev, [shortestQueueKey]: [...prev[shortestQueueKey], newCar] }));
        setTimeout(() => {
          setLaneQueues(prev => ({ ...prev, [shortestQueueKey]: prev[shortestQueueKey]?.map(c => c.id === newCar.id ? { ...c, isNew: false } : c) || [] }));
        }, 500);
      }
    }

    currentHistory.statusGardu.forEach((gardu, index) => {
      if (gardu.status === 'bebas' && prevHistory.statusGardu[index].status === 'sibuk') {
        const queue = laneQueues[gardu.id];
        if (queue && queue.length > 0) {
          const carToLeave = queue[0];
          setLaneQueues(prev => ({
            ...prev,
            [gardu.id]: prev[gardu.id].map(c => c.id === carToLeave.id ? { ...c, isLeaving: true } : c)
          }));
          setTimeout(() => {
            setLaneQueues(prev => ({ ...prev, [gardu.id]: prev[gardu.id].slice(1) }));
          }, 2000);
        }
      }
    });

    setChartData(prevData => [...prevData, { waktu: currentHistory.waktu, antrean: currentHistory.panjangAntrean }]);
    if (currentHistory.event) { setEventLog(prevLog => [`[${currentHistory.waktu}d] ${currentHistory.event}`, ...prevLog].slice(0, 50)); }
  }, [currentFrame, simulationResult]);

  const frameData = simulationResult ? simulationResult.history[currentFrame] : null;

  return (
    <div className="bg-[#0a192f] text-gray-300 min-h-screen font-mono overflow-hidden">
      <Stars />
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1F2937', color: '#FFF', border: '1px solid #4B5563' } }} />
      <div className="relative z-10 container mx-auto p-4">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg flex items-center justify-center gap-4"><FaRoad /> Simulator Gerbang Tol</h1>
        </header>
        
        <div className="bg-black bg-opacity-20 p-4 rounded-lg shadow-2xl border border-cyan-400 border-opacity-20 mb-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries({ 'Gardu Otomatis': {key: 'garduOtomatis', max: 8}, 'Gardu Manual': {key: 'garduManual', max: 8}, 'Mobil / Menit': {key: 'mobilPerMenit', max: 120}, '% E-Toll': {key: 'persentaseEToll', max: 100}, 'Durasi (detik)': {key: 'durasiSimulasiDetik', max: 1800, step: 60}, }).map(([label, {key, max, step}]) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-200">{label}</label>
                  <input type="range" name={key} id={key} min="0" max={max} step={step || 1} value={config[key]} onChange={handleConfigChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" disabled={isLoading}/>
                  <span className="text-yellow-300 font-bold text-lg">{config[key]}</span>
                </div>
              ))}
              <div className="flex flex-col justify-center">
                <label htmlFor="polaTrafik" className="block text-sm font-medium text-gray-200">Pola Trafik</label>
                <select name="polaTrafik" id="polaTrafik" value={config.polaTrafik} onChange={handleConfigChange} className="bg-gray-700 text-white rounded p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mt-2">
                  <option value="stabil">Stabil</option>
                  <option value="jam_sibuk">Jam Sibuk</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-full flex-grow"><button onClick={startSimulation} disabled={isLoading} className="w-full h-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors text-2xl flex items-center justify-center gap-2 shadow-lg"><FaPlay /> {isLoading ? 'Memuat...' : 'Mulai'}</button></div>
              <div className="bg-black bg-opacity-20 p-4 rounded-lg shadow-inner border border-gray-400 border-opacity-30">
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Manajemen Skenario</h3>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} placeholder="Nama Skenario" className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"/>
                  <button onClick={handleSaveScenario} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded transition-colors" title="Simpan Skenario"><FaSave/></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedScenarios.map(sc => (<button key={sc.name} onClick={() => handleLoadScenario(sc)} className="bg-gray-600 hover:bg-gray-700 text-sm py-1 px-3 rounded-full flex items-center gap-1"><FaFolderOpen/> {sc.name}</button>))}
                  {savedScenarios.length === 0 && <p className="text-gray-500 text-sm">Belum ada skenario.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden border-2 border-cyan-400 border-opacity-30 shadow-2xl" style={{ background: 'linear-gradient(to bottom, #0a192f, #172a45)' }}>
          <div className="absolute inset-0 w-full h-full" style={{ perspective: '600px' }}>
            <div className="absolute w-[250%] h-full -ml-[75%] bg-gray-600 transform rotate-x-[60deg] origin-bottom shadow-inner">
              <div className="absolute w-full h-full bg-black opacity-40"></div>
              {(frameData?.statusGardu || garduLayout).map((g, index, arr) => (
                <div key={g.id} className="absolute top-0 h-full w-1 bg-yellow-400 opacity-10" style={{ left: `${(100 / (arr.length + 1)) * (index + 1)}%` }}></div>
              ))}
            </div>
          </div>
          
          <div className="absolute top-[50%] -translate-y-1/2 w-full flex flex-col items-center">
            <div className="w-full flex justify-around items-start">
              {(frameData?.statusGardu || garduLayout).map((g) => (
                <CarLane key={g.id} gardu={g} cars={laneQueues[g.id] || []} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
           <div className="lg:col-span-3 bg-black bg-opacity-30 p-4 rounded-lg border border-gray-400 border-opacity-50 backdrop-blur-sm"><h2 className="text-xl font-semibold mb-4 text-center text-gray-100 flex items-center justify-center gap-2"><FaChartLine/> Grafik Panjang Antrean</h2><div className="w-full h-64"><ResponsiveContainer><LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF30" /><XAxis dataKey="waktu" stroke="#FFFFFF80" /><YAxis stroke="#FFFFFF80" allowDecimals={false}/><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} /><Legend wrapperStyle={{color: '#FFF'}} /><Line type="monotone" dataKey="antrean" name="Panjang Antrean" stroke="#FBBF24" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
           <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-black bg-opacity-30 p-4 rounded-lg border border-gray-400 border-opacity-50 backdrop-blur-sm"><h2 className="text-xl font-semibold mb-2 text-center text-gray-100 flex items-center justify-center gap-2"><FaListAlt/> Live Event Log</h2><ul className="text-xs text-gray-200 h-40 overflow-y-auto flex flex-col-reverse bg-black bg-opacity-20 p-2 rounded-md">{eventLog.length > 0 ? eventLog.map((log, index) => (<li key={index} className="px-2 py-1 border-b border-gray-800 animate-fade-in">{log}</li>)) : <li className="text-center text-gray-500">Menunggu event...</li>}</ul></div>
            <div className="bg-black bg-opacity-30 p-4 rounded-lg border border-gray-400 border-opacity-50 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-3 text-center text-gray-100 flex items-center justify-center gap-2"><FaFileContract /> Laporan Analisis Akhir</h2>
              {simulationResult && !isPlaying ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Total Mobil Dilayani:</span><span className="font-bold text-green-400">{simulationResult.statistikAkhir.totalMobilDilayani}</span></div>
                  <div className="flex justify-between"><span>Rata-rata Waktu Tunggu:</span><span className="font-bold text-yellow-400">{simulationResult.statistikAkhir.rataRataWaktuTunggu} dtk</span></div>
                  <div className="flex justify-between"><span>Waktu Tunggu Terlama:</span><span className="font-bold text-red-400">{simulationResult.statistikAkhir.waktuTungguMaks} dtk</span></div>
                  <div className="flex justify-between"><span>Antrean Terpanjang:</span><span className="font-bold text-red-400">{simulationResult.statistikAkhir.panjangAntreanMaks} mobil</span></div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-300">Utilisasi Gardu:</h4>
                    <ul className="list-disc list-inside ml-2">
                      {simulationResult.statistikAkhir.utilisasiGardu.map(g => (
                        <li key={g.id}><span>{g.id}:</span><span className="font-bold float-right">{g.utilization}%</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : <p className="text-center text-gray-500">Selesaikan simulasi untuk melihat laporan.</p>}
            </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default App;
