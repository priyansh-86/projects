// FILE: src/App.jsx
import React, { useState, useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';

// --- Icon Components (Inline SVGs) ---
const UploadIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const FileIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);

const CopyIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const SpinnerIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
    <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="18.07" y2="18.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="18.07" y2="4.93"></line>
  </svg>
);

const QrCodeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="5" height="5" x="3" y="3" rx="1"></rect>
    <rect width="5" height="5" x="16" y="3" rx="1"></rect>
    <rect width="5" height="5" x="3" y="16" rx="1"></rect>
    <path d="M21 16h-1a2 2 0 0 0-2 2v1"></path>
    <path d="M21 21v-1a2 2 0 0 0-2-2h-1"></path>
    <path d="M8 3H7a2 2 0 0 0-2 2v1"></path>
    <path d="M3 8V7a2 2 0 0 1 2-2h1"></path>
    <path d="M8 16H7a2 2 0 0 1-2-2v-1"></path>
    <path d="M3 16v1a2 2 0 0 0 2 2h1"></path>
    <path d="M16 8h1a2 2 0 0 1 2 2v1"></path>
    <path d="M16 3v1a2 2 0 0 0 2 2h1"></path>
    <path d="M12 8h.01"></path>
    <path d="M12 12h.01"></path>
    <path d="M12 16h.01"></path>
    <path d="M16 12h.01"></path>
    <path d="M16 16h.01"></path>
    <path d="M8 12h.01"></path>
  </svg>
);

// --- Helper Function ---
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- Main App Component ---
export default function App() {
  const [file, setFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [shareLink, setShareLink] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQR, setShowQR] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploadState('idle'); 
    setShareLink('');
    setErrorMessage(''); 
    setShowQR(false);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select a file first.");
      return;
    }
    
    setUploadState('uploading');
    setErrorMessage('');
    setShowQR(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData, 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const blobData = await response.json();
      
      setShareLink(blobData.url);
      setUploadState('completed');

    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage(`Upload failed: ${error.message}`);
      setUploadState('error');
    }
  };

  const copyToClipboard = () => {
    if (!shareLink) return;
    const textArea = document.createElement('textarea');
    textArea.value = shareLink;
    textArea.style.position = 'fixed'; 
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000); 
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
    document.body.removeChild(textArea);
  };
  
  const resetApp = () => {
    setFile(null);
    setUploadState('idle');
    setShareLink('');
    setErrorMessage('');
    setShowQR(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100 via-transparent to-purple-100 -z-10"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 md:p-8 transform transition-all">
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-blue-600 rounded-full shadow-lg">
            <UploadIcon className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">
          Quick Share
        </h1>

        {/* --- 1. File Upload / Dropzone --- */}
        {!file && uploadState !== 'completed' && (
          <div
            className={`relative flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-lg cursor-pointer
              ${dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 bg-gray-50/50'}
              transition-all`}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadIcon className="w-12 h-12 mb-4 text-gray-400" />
              <p className="mb-2 text-md text-gray-600">
                <span className="font-semibold">Drag & drop your file</span>
              </p>
              <p className="text-xs text-gray-500">or click to browse</p>
            </div>
          </div>
        )}

        {/* --- 2. File Details & Upload Button --- */}
        {file && uploadState === 'idle' && (
          <div className="text-center animate-fade-in">
            <div className="flex items-center w-full bg-gray-50 p-4 rounded-lg border border-gray-200 mb-5">
              <FileIcon className="w-8 h-8 text-blue-500 mr-4 shrink-0" />
              <div className="text-left overflow-hidden">
                <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              className="w-full px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all transform hover:scale-105"
            >
              Start Upload
            </button>
          </div>
        )}

        {/* --- 3. Uploading Progress --- */}
        {uploadState === 'uploading' && (
          <div className="w-full text-center h-52 flex flex-col justify-center items-center animate-fade-in">
            <SpinnerIcon className="w-12 h-12 text-blue-600" />
            <p className="text-gray-600 mt-4 text-lg">Uploading...</p>
            <p className="text-sm text-gray-500">Please wait, this may take a moment.</p>
          </div>
        )}
        
        {/* --- 4. Upload Complete & Share Link --- */}
        {uploadState === 'completed' && shareLink && (
          <div className="text-center transition-all animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Upload Complete!
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Your file is ready to share.
            </p>

            {/* --- QR CODE SECTION --- */}
            {showQR && (
              <div className="p-4 bg-white rounded-lg border border-gray-200 mb-4 shadow-sm animate-fade-in">
                <QRCode
                  value={shareLink}
                  size={200}
                  level="M"
                  className="mx-auto"
                />
                <p className="text-xs text-gray-500 mt-2">Scan to download</p>
              </div>
            )}
            
            <div className="flex w-full mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-grow p-3 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={copyToClipboard}
                title="Copy Link"
                className={`w-14 p-3 text-white transition-colors flex items-center justify-center
                  ${isCopying ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
                  focus:outline-none focus:ring-4 focus:ring-blue-300`}
              >
                {isCopying ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <CopyIcon className="w-5 h-5" />
                )}
              </button>
              {/* QR CODE TOGGLE BUTTON */}
              <button
                onClick={() => setShowQR(!showQR)}
                title={showQR ? "Hide QR Code" : "Show QR Code"}
                className={`w-14 p-3 text-white rounded-r-lg transition-colors flex items-center justify-center ml-1
                  ${showQR ? 'bg-gray-700 hover:bg-gray-800' : 'bg-gray-500 hover:bg-gray-600'}
                  focus:outline-none focus:ring-4 focus:ring-gray-300`}
              >
                <QrCodeIcon className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={resetApp}
              className="w-full px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all"
            >
              Transfer Another File
            </button>
          </div>
        )}

        {/* --- 5. Error State --- */}
        {errorMessage && (
          <div className="mt-4 text-center p-3 bg-red-100 text-red-700 rounded-lg text-sm animate-fade-in">
            <p>{errorMessage}</p>
            {uploadState === 'error' && (
               <button
                onClick={resetApp}
                className="mt-2 px-4 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}