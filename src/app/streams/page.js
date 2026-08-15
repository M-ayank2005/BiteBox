"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/legacy/image";
import { useDarkMode } from "../DarkModeContext";
import { Video, Users, Play, Clock, Heart, MessageCircle, Radio } from "lucide-react";
import Loader from "@/Components/loader";

const StreamsPage = () => {
  const [liveStreams, setLiveStreams] = useState([]);
  const [endedStreams, setEndedStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useDarkMode();
  const router = useRouter();

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000";
        const [liveResponse, endedResponse] = await Promise.all([
          axios.get(`${backendUrl}/api/streams/live`),
          axios.get(`${backendUrl}/api/streams/ended`)
        ]);
        
        setLiveStreams(
          (liveResponse.data || []).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        );

        setEndedStreams(
          (endedResponse.data || []).sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
        );
      } catch (error) {
        console.error("Error fetching streams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const StreamCard = ({ stream, type }) => {
    const handleStreamClick = () => {
      if (type === "live") {
        router.push(`/streams/joinlivestream?id=${stream.streamId}`);
      } else {
        router.push(`/streams/joinlivestream?id=${stream.streamId}`);
      }
    };

    return (
      <div
        onClick={handleStreamClick}
        className={`relative group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="aspect-video relative bg-black">
          <Image
            src={stream.thumbnail || "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"}
            alt={stream.title}
            layout="fill"
            objectFit="cover"
            className="group-hover:opacity-90 transition"
          />
          {type === "live" && (
            <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <span className="animate-pulse w-2.5 h-2.5 bg-white rounded-full"></span>
              LIVE
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-yellow-500 transition">{stream.title}</h3>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-pink-500">
              <Heart className="w-4 h-4 fill-current" />
              <span>{stream.likes?.length || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4 text-yellow-500" />
            <span>{stream.username || "Chef"}</span>
          </div>

          {type === "ended" && stream.duration && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Duration: {Math.floor(stream.duration / 60)}m {stream.duration % 60}s</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1 border-t dark:border-gray-700">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{stream.comments?.length || 0} comments</span>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ type }) => (
    <div className={`flex flex-col items-center justify-center p-12 rounded-2xl border text-center ${
      darkMode ? "bg-gray-800/50 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"
    }`}>
      <Video className="w-12 h-12 mb-3 text-gray-400" />
      <h3 className="text-xl font-bold mb-1">No {type} Streams Found</h3>
      <p className="text-sm text-gray-500">
        {type === "Live" 
          ? "There are currently no active broadcasts. Start your own!"
          : "No previous recorded stream sessions found."}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader/>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-yellow-500 text-white p-8 rounded-3xl shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-yellow-100 font-bold text-sm tracking-wider uppercase">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Streaming Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">BiteBox Cooking Streams</h1>
            <p className="text-yellow-100 text-sm sm:text-base">Broadcast your cooking recipes live or join chef streams worldwide.</p>
          </div>

          <button
            onClick={() => router.push("/streams/startnewlive")}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-yellow-600 hover:bg-yellow-50 font-bold shadow-lg transition active:scale-95 text-base"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Live Stream
          </button>
        </div>

        {/* Live Streams Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-gray-800">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="inline-block w-3.5 h-3.5 bg-red-600 rounded-full animate-pulse"></span>
              Active Live Streams ({liveStreams.length})
            </h2>
          </div>

          {liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map((stream) => (
                <StreamCard key={stream._id || stream.streamId} stream={stream} type="live" />
              ))}
            </div>
          ) : (
            <EmptyState type="Live" />
          )}
        </section>

        {/* Ended Streams Section */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b pb-4 dark:border-gray-800">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-500" />
              Previous Streams ({endedStreams.length})
            </h2>
          </div>

          {endedStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endedStreams.map((stream) => (
                <StreamCard key={stream._id || stream.streamId} stream={stream} type="ended" />
              ))}
            </div>
          ) : (
            <EmptyState type="Ended" />
          )}
        </section>
      </div>
    </div>
  );
};

export default StreamsPage;