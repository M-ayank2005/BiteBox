"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useDarkMode } from "../../DarkModeContext";
import { UserAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Radio, Users, Heart, Send, Volume2, VolumeX, Maximize, AlertCircle } from "lucide-react";
import loader from "@/Components/loader";

const ViewerStreamContent = () => {
  const { darkMode } = useDarkMode();
  const { user } = UserAuth();
  const router = useRouter();

  const [streamId, setStreamId] = useState("");
  const [streamDetails, setStreamDetails] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Extract stream ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id");

    if (idFromUrl) {
      setStreamId(idFromUrl);
    } else {
      alert("No stream ID found in URL.");
      router.push("/streams");
    }
  }, [router]);

  // Fetch initial stream metadata
  useEffect(() => {
    if (!streamId) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
    axios.get(`${backendUrl}/api/streams/${streamId}`)
      .then(res => {
        setStreamDetails(res.data);
        setLikesCount(res.data.likes ? res.data.likes.length : 0);
        if (res.data.comments) setComments(res.data.comments);
        if (user && res.data.likes) {
          setHasLiked(res.data.likes.some(like => like.userId === user.email));
        }
      })
      .catch(err => console.error("Error fetching stream details:", err));
  }, [streamId, user]);

  // Socket.IO WebRTC Viewer Connection
  useEffect(() => {
    if (!streamId) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.emit("join-as-viewer", { streamId });

    // Handle signals from Broadcaster
    socket.on("signal", async ({ from, signal }) => {
      if (signal.type === "offer") {
        console.log("WebRTC offer received from host");
        
        const peer = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });
        peerRef.current = peer;

        // When host tracks arrive, render in video element
        peer.ontrack = (event) => {
          console.log("Remote track received:", event.streams[0]);
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.play().catch(e => console.warn("Auto-play error:", e));
          }
          setIsConnected(true);
        };

        // ICE candidate handler
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("signal", {
              to: from,
              signal: { type: "candidate", candidate: event.candidate }
            });
          }
        };

        // Set Remote Description (Offer) & Create Local Description (Answer)
        await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("signal", {
          to: from,
          signal: { type: "answer", sdp: peer.localDescription }
        });
      } else if (signal.type === "candidate" && peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    // Handle real-time chat messages
    socket.on("receive-chat-message", (commentObj) => {
      setComments(prev => [...prev, commentObj]);
    });

    // Handle viewer count updates
    socket.on("viewer-count-update", (count) => {
      setViewerCount(count);
    });

    // Handle host ending stream
    socket.on("stream-ended", () => {
      setIsStreamEnded(true);
      setIsConnected(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    });

    return () => {
      if (peerRef.current) peerRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [streamId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleSendChatMessage = (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !socketRef.current) return;

    if (!user) {
      alert("Please login to participate in live chat!");
      return;
    }

    const userLabel = user.displayName || user.email?.split('@')[0] || "Viewer";
    socketRef.current.emit("send-chat-message", {
      streamId,
      user: userLabel,
      text: commentText.trim()
    });

    setCommentText("");
  };

  const handleLikeStream = async () => {
    if (!user) {
      alert("Please login to like this stream!");
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
      if (!hasLiked) {
        await axios.put(`${backendUrl}/api/streams/${streamId}/like`, { userId: user.email });
        setLikesCount(prev => prev + 1);
        setHasLiked(true);
      } else {
        await axios.put(`${backendUrl}/api/streams/${streamId}/unlike`, { userId: user.email });
        setLikesCount(prev => Math.max(0, prev - 1));
        setHasLiked(false);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleLeaveStream = () => {
    if (peerRef.current) peerRef.current.close();
    if (socketRef.current) socketRef.current.disconnect();
    router.push("/streams");
  };

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
    }`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex justify-between items-center bg-gray-800 text-white px-6 py-4 rounded-2xl shadow-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="text-xl font-bold line-clamp-1">{streamDetails?.title || "BiteBox Live Stream"}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold bg-gray-700 px-3 py-1.5 rounded-full">
              <Users className="w-4 h-4 text-blue-400" />
              <span>{viewerCount} Watching</span>
            </div>

            <button
              onClick={handleLeaveStream}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 font-semibold text-white rounded-full text-sm transition"
            >
              Leave Stream
            </button>
          </div>
        </div>

        {/* Video Player & Live Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Player Screen */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video relative rounded-2xl overflow-hidden bg-black border dark:border-gray-700 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Waiting / Disconnected State Overlay */}
              {(!isConnected && !isStreamEnded) && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
                  <p className="text-gray-300 font-medium">Connecting to live stream broadcast...</p>
                </div>
              )}

              {/* Stream Ended Overlay */}
              {isStreamEnded && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-2" />
                  <h3 className="text-2xl font-bold text-white">Broadcast Has Ended</h3>
                  <p className="text-gray-400">The host has closed this live stream session.</p>
                  <button
                    onClick={() => router.push("/streams")}
                    className="px-6 py-2.5 bg-yellow-500 text-white font-bold rounded-full hover:bg-yellow-600 transition"
                  >
                    Back to All Streams
                  </button>
                </div>
              )}

              {/* Video Controls Overlay */}
              {isConnected && (
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-6 py-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider">LIVE</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition">
                      {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full transition">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Info Box */}
            <div className={`p-6 rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{streamDetails?.title}</h2>
                  <p className="text-sm text-yellow-500 font-semibold">Host: {streamDetails?.username || "BiteBox Chef"}</p>
                </div>

                <button
                  onClick={handleLikeStream}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition shadow-sm ${
                    hasLiked
                      ? "bg-pink-100 dark:bg-pink-900/40 text-pink-500"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-pink-50 text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${hasLiked ? "fill-current text-pink-500" : ""}`} />
                  <span>{likesCount}</span>
                </button>
              </div>

              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {streamDetails?.description || "Enjoy the live cooking stream!"}
              </p>
            </div>
          </div>

          {/* Real-time Live Chat Panel */}
          <div className={`p-6 rounded-2xl border flex flex-col h-[520px] ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <span>Live Chat</span>
              <span className="text-xs font-normal bg-green-500/20 text-green-500 px-2.5 py-1 rounded-full">Real-time</span>
            </h2>

            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
              {comments.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Say hello! Be the first to chat in this stream.
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

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a chat message..."
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
    </div>
  );
};

export default function JoinLiveStream() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{loader()}</div>}>
      <ViewerStreamContent />
    </Suspense>
  );
}