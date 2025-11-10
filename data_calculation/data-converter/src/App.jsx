// src/App.jsx

import { useState, useMemo } from 'react';
import Select from 'react-select';

// --- ICONS ---
// (Social icons are defined in the Footer component)
const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75c-.621 0-1.125-.504-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876V2.25c0-.621-.504-1.125-1.125-1.125H7.875c-.621 0-1.125.504-1.125 1.125v3.375a9.06 9.06 0 0 0 1.5.124M12.75 10.125a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-green-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);


// --- DATA CONVERTER CONSTANTS ---
const unitOptions = [
  'b', 'B', 'Kb', 'KB', 'Mb', 'MB', 'Gb', 'GB', 'Tb', 'TB', 'Pb', 'PB', 'Eb', 'EB', 'Zb', 'ZB', 'Yb', 'YB'
];

const getConversionFactors = (base) => {
  const K = base; // 1024 or 1000
  return {
    b: 1 / 8, Kb: (K) / 8, Mb: (K ** 2) / 8, Gb: (K ** 3) / 8, Tb: (K ** 4) / 8, Pb: (K ** 5) / 8, Eb: (K ** 6) / 8, Zb: (K ** 7) / 8, Yb: (K ** 8) / 8,
    B: 1, KB: K, MB: K ** 2, GB: K ** 3, TB: K ** 4, PB: K ** 5, EB: K ** 6, ZB: K ** 7, YB: K ** 8,
  };
};

const formattedUnitOptions = unitOptions.map(unit => ({
  value: unit, label: unit
}));

// --- DOWNLOAD CALC CONSTANTS ---
const speedBase = 1000; 
const speedUnits = {
  bps: 1, Kbps: speedBase, Mbps: speedBase ** 2, Gbps: speedBase ** 3,
  Bps: 8, KBps: speedBase * 8, MBps: (speedBase ** 2) * 8, GBps: (speedBase ** 3) * 8,
};
const formattedSpeedOptions = Object.keys(speedUnits).map(unit => ({
  value: unit, label: unit
}));

// --- SHARED STYLES FOR REACT-SELECT ---
const customSelectStyles = {
  control: (p) => ({ ...p, backgroundColor: '#374151', borderColor: '#4B5563', borderRadius: '0.5rem', padding: '0.35rem', boxShadow: 'none', '&:hover': { borderColor: '#3B82F6' }, }),
  singleValue: (p) => ({ ...p, color: 'white' }),
  menu: (p) => ({ ...p, backgroundColor: '#1F2937', borderColor: '#4B5563' }),
  option: (p, s) => ({ ...p, backgroundColor: s.isFocused ? '#3B82F6' : '#1F2937', color: 'white', '&:active': { backgroundColor: '#3B82F6' }, }),
  input: (p) => ({ ...p, color: 'white' }),
};

// --- HELPER FUNCTIONS ---
const formatResult = (num) => {
  const formatted = num.toFixed(6);
  return parseFloat(formatted);
};
const formatTime = (totalSeconds) => {
  if (totalSeconds < 0 || !isFinite(totalSeconds)) return "N/A";
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let time = "";
  if (days > 0) time += `${days}d `;
  if (hours > 0) time += `${hours}h `;
  if (minutes > 0) time += `${minutes}m `;
  if (seconds > 0 || time === "") time += `${seconds.toFixed(2)}s`;

  return time.trim();
};

// --- 1. DATA CONVERTER COMPONENT ---
function DataConverter() {
  const [inputValue, setInputValue] = useState(1024);
  const [fromUnit, setFromUnit] = useState('KB');
  const [toUnit, setToUnit] = useState('MB');
  const [calcBase, setCalcBase] = useState(1024);
  const [isCopied, setIsCopied] = useState(false);

  const conversionFactors = useMemo(() => getConversionFactors(calcBase), [calcBase]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleFromChange = (opt) => setFromUnit(opt.value);
  const handleToChange = (opt) => setToUnit(opt.value);
  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const result = useMemo(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return 0;
    const valueInBytes = value * conversionFactors[fromUnit];
    const res = valueInBytes / conversionFactors[toUnit];
    return formatResult(res);
  }, [inputValue, fromUnit, toUnit, conversionFactors]);

  const allConversions = useMemo(() => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return [];
    const valueInBytes = value * conversionFactors[fromUnit];
    return unitOptions.map(unit => {
      const res = valueInBytes / conversionFactors[unit];
      return {
        unit: unit,
        value: formatResult(res).toLocaleString()
      };
    });
  }, [inputValue, fromUnit, conversionFactors]);

  const currentFromOption = formattedUnitOptions.find(o => o.value === fromUnit);
  const currentToOption = formattedUnitOptions.find(o => o.value === toUnit);

  return (
    <div className="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl">
      <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">
        Data Storage Converter
      </h1>

      <div className="flex justify-center items-center space-x-4 mb-6">
        <span className={`text-sm font-medium ${calcBase === 1000 ? 'text-gray-500' : 'text-white'}`}>
          Binary (1024)
        </span>
        <button
          onClick={() => setCalcBase(calcBase === 1024 ? 1000 : 1024)}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${calcBase === 1024 ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${calcBase === 1024 ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm font-medium ${calcBase === 1000 ? 'text-white' : 'text-gray-500'}`}>
          Decimal (1000)
        </span>
      </div>

      <div className="flex flex-col mb-6">
        <label htmlFor="amount" className="text-sm font-medium text-gray-400 mb-2">Amount</label>
        <input
          type="text" id="amount" value={inputValue} onChange={handleInputChange}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div className="flex flex-col"><label className="text-sm font-medium text-gray-400 mb-2">From</label>
          <Select 
            value={currentFromOption} 
            onChange={handleFromChange} 
            options={formattedUnitOptions} 
            styles={customSelectStyles} 
            isSearchable={false} 
            classNamePrefix="custom-select"
          />
        </div>
        <button onClick={handleSwap} className="p-3 bg-gray-700 text-gray-300 rounded-lg h-full flex items-center justify-center transition-all duration-200 hover:bg-blue-600 hover:text-white" title="Swap units">
          <SwapIcon />
        </button>
        <div className="flex flex-col"><label className="text-sm font-medium text-gray-400 mb-2">To</label>
          <Select 
            value={currentToOption} 
            onChange={handleToChange} 
            options={formattedUnitOptions} 
            styles={customSelectStyles} 
            isSearchable={false} 
            classNamePrefix="custom-select"
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-lg text-gray-400 mb-2">Result:</p>
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-4xl font-semibold text-blue-400 break-words">
            {result.toLocaleString()}
          </h2>
          <button
            onClick={() => handleCopy(result.toString())}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {isCopied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
        <p className="text-md text-gray-500 mt-2">
          {parseFloat(inputValue || 0).toLocaleString()} {fromUnit} = {result.toLocaleString()} {toUnit}
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-center text-gray-300 mb-4">All Conversions</h3>
        <div className="max-h-48 overflow-y-auto rounded-lg bg-gray-900 p-2" style={{ scrollbarColor: '#4B5563 #1F2937', scrollbarWidth: 'thin' }}>
          <table className="w-full text-sm text-left">
            <tbody>
              {allConversions.map(conv => (
                <tr key={conv.unit} className="border-b border-gray-700 last:border-b-0">
                  <td className="p-2 text-gray-300">{conv.unit}</td>
                  <td className="p-2 text-white font-mono text-right">{conv.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- 2. DOWNLOAD CALCULATOR COMPONENT ---
function DownloadCalculator() {
  const [fileSize, setFileSize] = useState(10);
  const [fileUnit, setFileUnit] = useState('GB');
  const [speedValue, setSpeedValue] = useState(100);
  const [speedUnit, setSpeedUnit] = useState('Mbps');

  const storageFactors = useMemo(() => getConversionFactors(1024), []);

  const calculatedTime = useMemo(() => {
    const size = parseFloat(fileSize);
    const speed = parseFloat(speedValue);
    if (isNaN(size) || isNaN(speed) || speed === 0) return 0;
    const sizeInBytes = size * storageFactors[fileUnit];
    const sizeInBits = sizeInBytes * 8;
    const speedInBps = speed * speedUnits[speedUnit];
    return sizeInBits / speedInBps;
  }, [fileSize, fileUnit, speedValue, speedUnit, storageFactors]);
  
  return (
    <div className="w-full max-w-lg bg-gray-800 p-8 rounded-xl shadow-2xl">
      <h1 className="text-3xl font-bold text-center text-blue-400 mb-8">
        Download Time Calculator
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-400 mb-2">File Size</label>
          <input
            type="text" value={fileSize}
            onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setFileSize(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-400 mb-2">Unit</label>
          <Select
            value={formattedUnitOptions.find(o => o.value === fileUnit)}
            onChange={(opt) => setFileUnit(opt.value)}
            options={formattedUnitOptions}
            styles={customSelectStyles}
            isSearchable={false}
            classNamePrefix="custom-select"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-400 mb-2">Speed</label>
          <input
            type="text" value={speedValue}
            onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setSpeedValue(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-400 mb-2">Unit</label> 
          <Select
            value={formattedSpeedOptions.find(o => o.value === speedUnit)}
            onChange={(opt) => setSpeedUnit(opt.value)}
            options={formattedSpeedOptions}
            styles={customSelectStyles}
            isSearchable={false}
            classNamePrefix="custom-select"
          />
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-lg text-gray-400 mb-2">Estimated Time:</p>
        <h2 className="text-4xl font-semibold text-blue-400 break-words">
          {formatTime(calculatedTime)}
        </h2>
      </div>
    </div>
  );
}

// --- 3. FOOTER COMPONENT ---
function Footer() {
  const GithubIcon = () => ( <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg> );
  const TwitterIcon = () => ( <svg viewBox="0 0 1200 1227" fill="currentColor" className="w-5 h-5"><path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6902H306.615L611.412 515.808L658.88 583.701L1055.08 1150.31H892.476L569.165 687.828Z"></path></svg> );
  const InstagramIcon = () => ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.667-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"></path></svg> );
  const TelegramIcon = () => ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M15.353 6.03l-1.31 6.104-5.284-1.72c-.482-.14-.476-.73.006-.9l6.04-2.73c.43-.19.82.26.54.65zM11.9 15.05c-.41 0-.33-.14-.46-.5l-1.02-3.32-2.77 1.02c-.5.18-.94-.09-.99-.68l-.48-2.98c-.05-.48.33-.7.73-.5l10.9 4.2c.57.22.56.81.01 1.02l-2.52 1.1c-.24.1-.5.05-.68-.13l-1.74-1.7z"></path></svg> );
  const EmailIcon = () => ( <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path></svg> );
  
  return (
    <footer className="mt-12 text-center text-gray-500">
      <p className="mb-4 text-sm">Made with 💜 by PRIYANSH</p>
      <div className="flex justify-center space-x-5">
        <a href="https://x.com/priyansh_86" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-gray-400 transition-all duration-300 hover:bg-gray-700 hover:text-[#1DA1F2]"><TwitterIcon /></a>
        <a href="https://github.com/priyansh-86" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-gray-400 transition-all duration-300 hover:bg-gray-700 hover:text-white"><GithubIcon /></a>
        <a href="https://instagram.com/priyansh__.86" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-gray-400 transition-all duration-300 hover:bg-gray-700 hover:text-[#E1306C]"><InstagramIcon /></a>
        <a href="https://t.me/priyansh_dev" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-gray-400 transition-all duration-300 hover:bg-gray-700 hover:text-[#2AABEE]"><TelegramIcon /></a>
        <a href="mailto:priyanshrajbhar499@gmail.com" className="p-2 rounded-full text-gray-400 transition-all duration-300 hover:bg-gray-700 hover:text-red-500"><EmailIcon /></a>
      </div>
    </footer>
  );
}


// --- 4. MAIN APP COMPONENT (UPDATED FOR LAYOUT) ---
function App() {
  return (
    // Yeh parent container ab main content (cards) aur footer ko vertically stack karega
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 py-12">
      
      {/* YEH NAYA WRAPPER HAI */}
      {/* Mobile par: flex-col (ek ke neeche ek) */}
      {/* Large screen (lg) par: flex-row (side-by-side) */}
      <div className="flex flex-col lg:flex-row justify-center items-start gap-8 w-full">
        {/* Left Side */}
        <DataConverter />
        {/* Right Side */}
        <DownloadCalculator />
      </div>
      
      {/* Footer hamesha neeche rahega */}
      <Footer />
    </div>
  );
}

export default App;