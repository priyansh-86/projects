// FILE: src/App.jsx
import React, { useState, useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';
import JSZip from 'jszip';

// --- Icon Components ---
const UploadIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const FilesIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z"></path>
    <path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8"></path>
    <path d="M15 2v5h5"></path>
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
    <rect width="5" height="5" x="3" y="3" rx="1"></rect><rect width="5" height="5" x="16" y="3" rx="1"></rect><rect width="5" height="5" x="3" y="16" rx="1"></rect><path d="M21 16h-1a2 2 0 0 0-2 2v1"></path><path d="M21 21v-1a2 2 0 0 0-2-2h-1"></path><path d="M8 3H7a2 2 0 0 0-2 2v1"></path><path d="M3 8V7a2 2 0 0 1 2-2h1"></path><path d="M8 16H7a2 2 0 0 1-2-2v-1"></path><path d="M3 16v1a2 2 0 0 0 2 2h1"></path><path d="M16 8h1a2 2 0 0 1 2 2v1"></path><path d="M16 3v1a2 2 0 0 0 2 2h1"></path><path d="M12 8h.01"></path><path d="M12 12h.01"></path><path d="M12 16h.01"></path><path d="M16 12h.01"></path><path d="M16 16h.01"></path><path d="M8 12h.01"></path>
  </svg>
);

const ShareIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

// --- Helper Functions ---
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getTotalSize(files) {
  const total = files.reduce((acc, file) => acc + file.size, 0);
  return formatFileSize(total);
}

function generateShareId() {
  return 'share_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// --- Main App Component ---
export default function App() {
  const [files, setFiles] = useState([]);
  const [uploadState, setUploadState] = useState('idle');
  const [shareLink, setShareLink] = useState('');
  const [shareId, setShareId] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setFiles(Array.from(selectedFiles));
    setUploadState('idle');
    setShareLink('');
    setShareId('');
    setErrorMessage('');
    setShowQR(false);
    setUploadProgress('');
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
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // --- 🔥 FIXED UPLOAD FUNCTION ---
  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage("Please select files first.");
      return;
    }

    setUploadState('uploading');
    setErrorMessage('');
    setShowQR(false);

    try {
      // 1. Create ZIP
      setUploadProgress('Creating ZIP file...');
      const zip = new JSZip();
      
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        zip.file(file.name, arrayBuffer);
      }
      
      // 2. Compress ZIP
      setUploadProgress('Compressing files...');
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      // 3. Upload to Vercel Blob (Direct Body)
      setUploadProgress('Uploading to cloud...');
      const fileName = `files-${Date.now()}.zip`;
      
      // ✅ FIX: No FormData, sending raw blob to avoid corruption
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
        body: zipBlob, 
      });

      if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      const blobData = await response.json();
      
      if (!blobData.url) {
        throw new Error('No URL received from server');
      }

      // ✅ FIX: Using Blob URL directly (no window.storage crash)
      const newShareId = generateShareId();
      setShareLink(blobData.url);
      setShareId(newShareId);
      
      // Optional: Save history to localStorage (safe)
      try {
        const historyItem = { 
          id: newShareId,
          url: blobData.url, 
          files: files.map(f => f.name), 
          date: new Date().toISOString() 
        };
        const existingHistory = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
        localStorage.setItem('uploadHistory', JSON.stringify([historyItem, ...existingHistory]));
      } catch (e) {
        console.warn("Could not save to local history", e);
      }

      setUploadState('completed');
      setUploadProgress('');

    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage(`Upload failed: ${error.message}`);
      setUploadState('error');
      setUploadProgress('');
    }
  };

  const copyToClipboard = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
  };

  const resetApp = () => {
    setFiles([]);
    setUploadState('idle');
    setShareLink('');
    setShareId('');
    setErrorMessage('');
    setShowQR(false);
    setUploadProgress('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans p-4">
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

        {/* File Upload / Dropzone */}
        {files.length === 0 && uploadState !== 'completed' && (
          <div
            className={`relative flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-lg cursor-pointer
              ${dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 bg-gray-50/50'}
              transition-all`}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => handleFileSelect(e.target.files)} 
              className="hidden" 
              multiple 
            />
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <FilesIcon className="w-12 h-12 mb-4 text-gray-400" />
              <p className="mb-2 text-md text-gray-600">
                <span className="font-semibold">Drag & drop your files</span>
              </p>
              <p className="text-xs text-gray-500">or click to browse</p>
            </div>
          </div>
        )}

        {/* File Details & Upload Button */}
        {files.length > 0 && uploadState === 'idle' && (
          <div className="text-center animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              {files.length} {files.length > 1 ? 'Files' : 'File'} Selected
            </h3>
            
            <div className="w-full bg-gray-50 p-3 rounded-lg border border-gray-200 mb-5 max-h-40 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between py-2">
                    <div className="flex items-center min-w-0">
                      <FileIcon className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-sm text-gray-600 mb-5">
              Total Size: <span className="font-medium">{getTotalSize(files)}</span>
            </p>
            
            <button
              onClick={handleUpload}
              className="w-full px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all transform hover:scale-105"
            >
              Create Share Link
            </button>
          </div>
        )}

        {/* Uploading Progress */}
        {uploadState === 'uploading' && (
          <div className="w-full text-center h-52 flex flex-col justify-center items-center animate-fade-in">
            <SpinnerIcon className="w-12 h-12 text-blue-600" />
            <p className="text-gray-600 mt-4 text-lg font-medium">Processing...</p>
            {uploadProgress && (
              <p className="text-sm text-gray-500 mt-2">{uploadProgress}</p>
            )}
          </div>
        )}
        
        {/* Upload Complete & Share Link */}
        {uploadState === 'completed' && shareLink && (
          <div className="text-center transition-all animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Files Uploaded!
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Share this link to download the files directly.
            </p>

            {/* Single QR Code Section */}
            {showQR && (
              <div className="p-4 bg-white rounded-lg border border-gray-200 mb-4 shadow-sm animate-fade-in">
                <QRCode value={shareLink} size={160} level="M" className="mx-auto" />
                <p className="text-xs text-gray-500 mt-3">Scan to download</p>
              </div>
            )}
            
            {/* Single Link Section */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 mb-4">
              <div className="flex items-center justify-center mb-3">
                <ShareIcon className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm font-semibold text-gray-700">Direct Download Link</p>
              </div>
              
              <div className="flex w-full mb-3">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-grow p-2.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={copyToClipboard}
                  title="Copy Link"
                  className={`w-12 p-2 text-white transition-colors flex items-center justify-center
                    ${isCopying ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
                    focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-r-lg`}
                >
                  {isCopying ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                </button>
              </div>
              
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all flex items-center justify-center"
              >
                <QrCodeIcon className="w-4 h-4 mr-2" />
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>
            </div>
            
            <button
              onClick={resetApp}
              className="w-full px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all"
            >
              Share More Files
            </button>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="mt-4 text-center p-4 bg-red-100 text-red-700 rounded-lg text-sm animate-fade-in">
            <p className="font-medium mb-2">⚠️ Error</p>
            <p className="text-xs">{errorMessage}</p>
            {uploadState === 'error' && (
              <button
                onClick={resetApp}
                className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
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
