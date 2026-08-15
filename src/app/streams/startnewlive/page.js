"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useDarkMode } from "../../DarkModeContext";
import { UserAuth } from "../../context/AuthContext";
import { Video, Mic, MicOff, Camera, CameraOff, Heart, Send, X, Users, Play, Radio } from "lucide-react";
import { useRouter } from 'next/navigation';

const StartNewLiveStream = () => {
  const { darkMode } = useDarkMode();
  const { user } = UserAuth();
  const router = useRouter();

  const [streamId, setStreamId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamStarted, setIsStreamStarted] = useState(false);
  const [streamData, setStreamData] = useState({
    title: "",
    description: "",
    thumbnail: "",
  });
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [likes, setLikes] = useState(0);

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({}); // Store peer connection for each viewer socket ID
  const chatBottomRef = useRef(null);

  // Auto-scroll live chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleCameraToggle = async () => {
    if (isCameraOn) {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      setLocalStream(null);
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (err) {
        console.error("Camera access error:", err);
        alert("Failed to access camera and microphone. Please check browser permissions.");
      }
    }
  };

  const handleMicToggle = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicEnabled;
        setIsMicEnabled(!isMicEnabled);
      }
    }
  };

  const handleStartBroadcast = async (e) => {
    e.preventDefault();
    if (!titleValidate()) return;

    if (!user) {
      alert("Please login to start a live stream!");
      router.push("/LoginPage");
      return;
    }

    if (!localStream) {
      alert("Please turn on your camera first before starting the broadcast.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate streamId
      const generatedId = Math.random().toString(36).substring(2, 10);
      setStreamId(generatedId);

      // 2. Register Stream in Database
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
      await axios.post(`${backendUrl}/api/streams`, {
        userId: user.email,
        username: user.displayName || user.email?.split('@')[0] || 'Chef Host',
        title: streamData.title,
        description: streamData.description,
        thumbnail: streamData.thumbnail || "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
        streamId: generatedId,
      });

      // 3. Connect to Socket.IO Signaling Server
      const socket = io(backendUrl);
      socketRef.current = socket;

      socket.emit("join-as-host", { streamId: generatedId });

      // 4. On Viewer Joined, create RTCPeerConnection for that viewer
      socket.on("viewer-joined", async ({ viewerSocketId }) => {
        console.log("New viewer joined:", viewerSocketId);

        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });

        peersRef.current[viewerSocketId] = peer;

        // Add broadcaster's media tracks to viewer connection
        localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

        // ICE candidates
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("signal", {
              to: viewerSocketId,
              signal: { type: "candidate", candidate: event.candidate }
            });
          }
        };

        // Create SDP Offer
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("signal", {
          to: viewerSocketId,
          signal: { type: "offer", sdp: peer.localDescription }
        });
      });

      // 5. Handle incoming WebRTC signals (SDP Answers & ICE Candidates)
      socket.on("signal", async ({ from, signal }) => {
        const peer = peersRef.current[from];
        if (!peer) return;

        if (signal.type === "answer") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === "candidate") {
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      });

      // 6. Handle real-time chat messages
      socket.on("receive-chat-message", (commentObj) => {
        setComments(prev => [...prev, commentObj]);
      });

      // 7. Real-time viewer count updates
      socket.on("viewer-count-update", (count) => {
        setViewerCount(count);
      });

      setIsStreamStarted(true);
    } catch (err) {
      console.error("Failed to start stream:", err);
      alert("Failed to initialize live stream: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const titleValidate = () => {
    if (!streamData.title.trim()) {
      alert("Stream title is required!");
      return false;
    }
    return true;
  };

  const handleSendChatMessage = (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !socketRef.current) return;

    const userLabel = user?.displayName || user?.email?.split('@')[0] || 'Host';
    socketRef.current.emit("send-chat-message", {
      streamId,
      user: userLabel,
      text: commentText.trim()
    });

    setCommentText("");
  };

  const handleEndStream = async () => {
    if (!confirm("Are you sure you want to end this live stream?")) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
      
      if (streamId) {
        await axios.put(`${backendUrl}/api/streams/${streamId}/end`);
      }

      if (socketRef.current) {
        socketRef.current.emit("end-stream", { streamId });
        socketRef.current.disconnect();
      }

      // Close all peer connections
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};

      // Stop camera/mic tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      setIsStreamStarted(false);
      router.push('/streams');
    } catch (err) {
      console.error("Error ending stream:", err);
      router.push('/streams');
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
    }`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {!isStreamStarted ? (
          /* Stream Setup Form & Camera Preview */
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 rounded-2xl shadow-xl border ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            {/* Form Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Radio className="w-8 h-8 text-red-500 animate-pulse" />
                <h1 className="text-3xl font-extrabold tracking-tight">Go Live on BiteBox</h1>
              </div>

              <form onSubmit={handleStartBroadcast} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">Stream Title *</label>
                  <input
                    type="text"
                    value={streamData.title}
                    onChange={(e) => setStreamData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Live Masterclass: Handmade Italian Pasta"
                    className={`w-full p-3 rounded-xl border transition focus:ring-2 focus:ring-yellow-500 ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea
                    value={streamData.description}
                    onChange={(e) => setStreamData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell viewers what you'll be cooking today..."
                    className={`w-full p-3 rounded-xl border h-28 resize-none transition focus:ring-2 focus:ring-yellow-500 ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    value={streamData.thumbnail}
                    onChange={(e) => setStreamData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    placeholder="https://..."
                    className={`w-full p-3 rounded-xl border transition focus:ring-2 focus:ring-yellow-500 ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !isCameraOn}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 text-white transition shadow-lg ${
                      !isCameraOn
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 active:scale-98"
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    ) : (
                      <>
                        <Play className="w-6 h-6 fill-current" />
                        {!isCameraOn ? "Enable Camera First" : "Start Live Broadcast"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Camera Setup Preview Box */}
            <div className="flex flex-col space-y-4">
              <h2 className="text-xl font-bold">Camera & Audio Test</h2>
              <div className="aspect-video relative rounded-2xl overflow-hidden bg-black border border-gray-700 shadow-inner flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraOn ? "hidden" : ""}`}
                />

                {!isCameraOn && (
                  <div className="text-center p-6 space-y-3">
                    <CameraOff className="w-16 h-16 text-gray-500 mx-auto" />
                    <p className="text-gray-400 text-sm">Camera is off. Click below to turn on video preview.</p>
                  </div>
                )}

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className={`p-3 rounded-full text-white transition ${isMicEnabled ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}`}
                    title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCameraToggle}
                    className={`p-3 rounded-full text-white transition ${isCameraOn ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}`}
                    title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
                  >
                    {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Live Streaming View */
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex justify-between items-center bg-red-600 text-white px-6 py-3 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="font-extrabold tracking-wider">LIVE BROADCAST</span>
                <span className="text-sm bg-red-800 px-3 py-1 rounded-full border border-white/20">ID: {streamId}</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="w-5 h-5" />
                  <span>{viewerCount} Viewers</span>
                </div>

                <button
                  onClick={handleEndStream}
                  className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 font-bold rounded-full text-sm transition shadow"
                >
                  End Stream
                </button>
              </div>
            </div>

            {/* Main Video & Live Chat Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Video Screen */}
              <div className="lg:col-span-2 space-y-4">
                <div className="aspect-video relative rounded-2xl overflow-hidden bg-black border dark:border-gray-700 shadow-2xl">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* On-screen controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-6 py-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10">
                    <div className="flex items-center gap-3">
                      <button onClick={handleMicToggle} className={`p-2.5 rounded-full ${isMicEnabled ? 'bg-blue-600' : 'bg-red-600'}`}>
                        {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </button>
                      <button onClick={handleCameraToggle} className={`p-2.5 rounded-full ${isCameraOn ? 'bg-blue-600' : 'bg-red-600'}`}>
                        {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="text-xs text-gray-300 font-mono">Direct Browser P2P WebRTC</div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <h1 className="text-2xl font-bold mb-2">{streamData.title}</h1>
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>{streamData.description || "No description provided."}</p>
                </div>
              </div>

              {/* Real-time Live Chat Drawer */}
              <div className={`p-6 rounded-2xl border flex flex-col h-[520px] ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between border-b pb-3 dark:border-gray-700">
                  <span>Live Stream Chat</span>
                  <span className="text-xs font-normal bg-green-500/20 text-green-500 px-2.5 py-1 rounded-full">Real-time</span>
                </h2>

                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                  {comments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      No chat messages yet. Viewers can send messages here!
                    </div>
                  ) : (
                    comments.map((comment, idx) => (
                      <div key={idx} className={`p-3 rounded-xl text-sm ${darkMode ? "bg-gray-700/60" : "bg-gray-100"}`}>
                        <span className="font-bold text-yellow-500 mr-2">{comment.user}:</span>
                        <span className="break-words">{comment.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Host Chat Input */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Send a chat message..."
                    className={`flex-1 p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                  <button
                    type="submit"
                    className="p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartNewLiveStream;