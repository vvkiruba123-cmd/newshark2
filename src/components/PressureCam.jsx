import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const PressureCam = () => {
  const [isCamActive, setIsCamActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [isLookingAway, setIsLookingAway] = useState(false);

  const videoRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastWarningTimeRef = useRef(0);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    const initFaceLandmarker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });
      } catch (err) {
        console.error('Failed to load FaceLandmarker:', err);
      }
    };

    initFaceLandmarker();
  }, []);

  // Voice Alert
  const triggerWarning = () => {
    const now = Date.now();
    if (now - lastWarningTimeRef.current > 3500) { // 3.5s cooldown
      lastWarningTimeRef.current = now;
      setWarningCount((prev) => prev + 1);
      setIsLookingAway(true);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Stay focused! Keep your eyes on the screen.");
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }

      setTimeout(() => setIsLookingAway(false), 2000);
    }
  };

  // Continuous frame analysis
  const detectFacePosition = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState >= 2 &&
      faceLandmarkerRef.current
    ) {
      const results = faceLandmarkerRef.current.detectForVideo(
        videoRef.current,
        performance.now()
      );

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        const noseX = landmarks[1].x;
        const leftX = landmarks[234].x;
        const rightX = landmarks[454].x;

        const ratio = (noseX - leftX) / (rightX - leftX);

        // Turned left/right check
        if (ratio < 0.32 || ratio > 0.68) {
          triggerWarning();
        }
      } else {
        // Face missing from camera
        triggerWarning();
      }
    }

    animFrameRef.current = requestAnimationFrame(detectFacePosition);
  };

  // Attach media stream when video mounts
  useEffect(() => {
    if (isCamActive && mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadeddata = () => {
        videoRef.current.play().catch((err) => console.error("Playback error:", err));
        detectFacePosition();
      };
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isCamActive, mediaStream]);

  // Toggle button handler
  const toggleCam = async () => {
    if (isCamActive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      setIsCamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: false
        });
        setMediaStream(stream);
        setIsCamActive(true);
      } catch (err) {
        console.error("Camera access failed:", err);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Toggle Button matching existing design */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={toggleCam}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            isCamActive
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
          }`}
        >
          {isCamActive ? 'Disable Cam' : 'Enable Pressure Cam'}
        </button>

        {isCamActive && (
          <span className="text-xs text-red-400 font-medium bg-red-950/60 px-2.5 py-1 rounded-full border border-red-500/30">
            ⚠️ Focus Violations: {warningCount}
          </span>
        )}
      </div>

      {/* Video Viewport */}
      {isCamActive && (
        <div className="relative mb-6 rounded-2xl overflow-hidden border border-slate-700 h-44 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono">
            REC • AI Focus Tracking
          </span>

          {/* Flash Warning Overlay */}
          {isLookingAway && (
            <div className="absolute inset-0 bg-red-600/40 backdrop-blur-[2px] flex items-center justify-center animate-pulse">
              <p className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-lg">
                ⚠️ Stay Focused! Keep eyes on screen
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PressureCam;