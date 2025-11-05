// --- DOM Elements ---
const welcomeScreen = document.getElementById('welcomeScreen');
const nameInput = document.getElementById('nameInput');
const continueBtn = document.getElementById('continueBtn');
const loadingConfig = document.getElementById('loadingConfig');

const homeScreen = document.getElementById('homeScreen');
const welcomeMessage = document.getElementById('welcomeMessage');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomInput = document.getElementById('joinRoomInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');

const roomScreen = document.getElementById('roomScreen');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const remoteVideoPlaceholder = document.getElementById('remoteVideoPlaceholder');

const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const hangupBtn = document.getElementById('hangupBtn');

const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const shareBtn = document.getElementById('shareBtn');

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

const shareModal = document.getElementById('shareModal');
const shareUrl = document.getElementById('shareUrl');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const qrcodeDiv = document.getElementById('qrcode');

// --- Global Variables ---
let currentStream; // Use this instead of localStream
let remoteStream;
let peerConnection;
let dataChannel;
let roomId;
let userName = 'Guest';
let facingMode = 'user'; // 'user' = front camera, 'environment' = back camera

// Firebase instance
let db;

// Listeners
let unsubscribeRoom;
let unsubscribeOfferCandidates;
let unsubscribeAnswerCandidates;

// Google ke free STUN servers
const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// --- Initialization ---
// NEW: App starts by fetching config
document.addEventListener('DOMContentLoaded', fetchConfigAndInitialize);

async function fetchConfigAndInitialize() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('Failed to fetch config. Make sure Vercel env vars are set.');
        }
        const firebaseConfig = await response.json();
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        // Config loaded, enable the "Continue" button
        loadingConfig.innerText = 'Config loaded. Please enter your name.';
        continueBtn.disabled = false;
        continueBtn.onclick = setupWelcomeScreen;

    } catch (error) {
        console.error(error);
        loadingConfig.innerText = error.message;
        loadingConfig.classList.add('text-red-500');
    }
}

function setupWelcomeScreen() {
    userName = nameInput.value.trim() || 'Guest';
    welcomeMessage.innerText = `Welcome, ${userName}!`;
    
    welcomeScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');

    // Now set up the home screen listeners
    initHome();
    checkUrlForRoom();
}

function initHome() {
    createRoomBtn.onclick = createRoom;
    joinRoomBtn.onclick = () => joinRoom(joinRoomInput.value);
    
    // Setup room listeners (they are not attached to buttons)
    muteBtn.onclick = toggleAudio;
    videoBtn.onclick = toggleVideo;
    switchCameraBtn.onclick = switchCamera;
    hangupBtn.onclick = hangUp;

    sendChatBtn.onclick = sendChatMessage;
    chatInput.onkeydown = (e) => {
        if (e.key === 'Enter') sendChatMessage();
    };

    shareBtn.onclick = showShareModal;
    closeModalBtn.onclick = () => shareModal.classList.add('hidden');
    copyUrlBtn.onclick = copyShareUrl;
}

// Check if user is joining via URL
function checkUrlForRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
        joinRoomInput.value = roomFromUrl;
    }
}

// --- Core Functions ---

async function startMedia() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: true 
        });
        localVideo.srcObject = currentStream;
        checkCameraDevices(); // Check if switch button should be shown
    } catch (e) {
        console.error('Error accessing media devices.', e);
        alert('Could not access camera or mic. Please allow permissions.');
    }
}

// NEW: Check for multiple cameras
async function checkCameraDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length > 1) {
            switchCameraBtn.classList.remove('hidden');
        }
    } catch (e) {
        console.error('Error enumerating devices:', e);
    }
}

// NEW: Switch Camera Function
async function switchCamera() {
    facingMode = (facingMode === 'user') ? 'environment' : 'user';
    
    // Get new stream with new facingMode
    await startMedia();

    // Replace the track in the peer connection
    if (peerConnection) {
        const videoTrack = currentStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
            sender.replaceTrack(videoTrack);
        }
    }
}

async function createRoom() {
    await startMedia();
    setupRoomUI();

    const roomRef = await db.collection('rooms').add({});
    roomId = roomRef.id;
    roomCodeDisplay.value = roomId;
    updateShareModal(roomId);

    const offerCandidates = roomRef.collection('offerCandidates');
    const answerCandidates = roomRef.collection('answerCandidates');

    peerConnection = new RTCPeerConnection(servers);

    currentStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, currentStream);
    });

    dataChannel = peerConnection.createDataChannel('chat');
    setupDataChannelEvents(dataChannel);

    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
        remoteVideoPlaceholder.classList.add('hidden');
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            offerCandidates.add(event.candidate.toJSON());
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    await roomRef.set({ offer: { sdp: offer.sdp, type: offer.type } });
    console.log('Room created with ID:', roomId);

    unsubscribeRoom = roomRef.onSnapshot(async (snapshot) => {
        const data = snapshot.data();
        if (peerConnection && !peerConnection.currentRemoteDescription && data?.answer) {
            console.log('Got answer');
            const answerDescription = new RTCSessionDescription(data.answer);
            await peerConnection.setRemoteDescription(answerDescription);
        }
    });

    unsubscribeAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                peerConnection.addIceCandidate(candidate);
            }
        });
    });
}

async function joinRoom(id) {
    if (!id) {
        alert('Please enter a room code.');
        return;
    }
    
    roomId = id;
    await startMedia();
    setupRoomUI();
    roomCodeDisplay.value = roomId;
    updateShareModal(roomId);
    
    console.log('Joining room:', roomId);

    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
        alert('Room does not exist.');
        hangUp();
        return;
    }

    peerConnection = new RTCPeerConnection(servers);

    currentStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, currentStream);
    });

    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
        remoteVideoPlaceholder.classList.add('hidden');
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            roomRef.collection('answerCandidates').add(event.candidate.toJSON());
        }
    };

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannelEvents(dataChannel);
    };

    const offer = roomDoc.data().offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    await roomRef.update({ answer: { sdp: answer.sdp, type: answer.type } });
    console.log('Joined room and sent answer');

    unsubscribeOfferCandidates = roomRef.collection('offerCandidates').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                peerConnection.addIceCandidate(candidate);
            }
        });
    });
}


// --- Data Channel (Chat) Functions ---

function setupDataChannelEvents(channel) {
    channel.onopen = () => {
        console.log('Data channel open');
        chatInput.disabled = false;
        sendChatBtn.disabled = false;
    };
    channel.onclose = () => {
        console.log('Data channel closed');
        chatInput.disabled = true;
        sendChatBtn.disabled = true;
    };
    // UPDATED: Handle JSON data
    channel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        displayChatMessage(data.message, data.sender);
    };
}

function sendChatMessage() {
    const message = chatInput.value;
    if (message.trim() === '') return;

    // UPDATED: Send JSON object with name
    const data = {
        sender: userName,
        message: message
    };

    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(data));
        displayChatMessage(message, 'You'); // Display 'You' locally
        chatInput.value = '';
    }
}

function displayChatMessage(message, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('p-2', 'rounded-lg', 'max-w-xs');
    
    if (sender === 'You') {
        msgDiv.classList.add('bg-blue-600', 'text-white', 'self-end', 'ml-auto');
        msgDiv.innerHTML = `<span class="font-bold">You:</span> ${message}`;
    } else {
        msgDiv.classList.add('bg-gray-600', 'text-white', 'self-start', 'mr-auto');
        // UPDATED: Show sender's name
        msgDiv.innerHTML = `<span class="font-bold">${sender}:</span> ${message}`;
    }
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

// --- UI & Control Functions ---

function setupRoomUI() {
    homeScreen.classList.add('hidden');
    roomScreen.classList.remove('hidden');
    chatInput.disabled = true;
    sendChatBtn.disabled = true;
    remoteVideoPlaceholder.classList.remove('hidden');
}

function updateShareModal(id) {
    const url = `${window.location.origin}${window.location.pathname}?room=${id}`;
    shareUrl.value = url;

    qrcodeDiv.innerHTML = ''; // Clear previous QR
    new QRCode(qrcodeDiv, {
        text: url,
        width: 192,
        height: 192
    });
}

function toggleAudio() {
    const audioTrack = currentStream.getAudioTracks()[0];
    if (audioTrack.enabled) {
        audioTrack.enabled = false;
        muteBtn.innerHTML = '🔇';
        muteBtn.classList.replace('bg-blue-600', 'bg-gray-600');
    } else {
        audioTrack.enabled = true;
        muteBtn.innerHTML = '🔈';
        muteBtn.classList.replace('bg-gray-600', 'bg-blue-600');
    }
}

function toggleVideo() {
    const videoTrack = currentStream.getVideoTracks()[0];
    if (videoTrack.enabled) {
        videoTrack.enabled = false;
        videoBtn.innerHTML = '🚫';
        videoBtn.classList.replace('bg-blue-600', 'bg-gray-600');
    } else {
        videoTrack.enabled = true;
        videoBtn.innerHTML = '📹';
        videoBtn.classList.replace('bg-gray-600', 'bg-blue-600');
    }
}

async function hangUp() {
    if (unsubscribeRoom) unsubscribeRoom();
    if (unsubscribeOfferCandidates) unsubscribeOfferCandidates();
    if (unsubscribeAnswerCandidates) unsubscribeAnswerCandidates();

    if (peerConnection) {
        peerConnection.close();
    }
    if (currentStream) { // Use currentStream
        currentStream.getTracks().forEach(track => track.stop());
    }

    if (roomId) {
        try {
            const roomRef = db.collection('rooms').doc(roomId);
            const offerCandidates = await roomRef.collection('offerCandidates').get();
            offerCandidates.forEach(async (doc) => await doc.ref.delete());
            const answerCandidates = await roomRef.collection('answerCandidates').get();
            answerCandidates.forEach(async (doc) => await doc.ref.delete());
            await roomRef.delete();
        } catch (error) {
            console.error("Error cleaning up firestore:", error);
        }
    }

    // Go back to the 'index.html' which will restart the flow
    window.location.href = 'index.html';
}

function showShareModal() {
    shareModal.classList.remove('hidden');
}

function copyShareUrl() {
    shareUrl.select();
    navigator.clipboard.writeText(shareUrl.value);
    copyUrlBtn.innerText = 'Copied!';
    setTimeout(() => {
        copyUrlBtn.innerText = 'Copy URL';
    }, 2000);
}