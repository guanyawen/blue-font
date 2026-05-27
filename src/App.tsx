/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { VisualSettings, AudioAnalysis } from './types';
import { AudioEngine } from './components/AudioEngine';
import { VJVisualizer } from './components/VJVisualizer';
import { ControlPanel } from './components/ControlPanel';
import { Headphones, VolumeX, Mic, Layers, Tv, HelpCircle, X } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<VisualSettings>({
    text: "LIQUID\nMETAL",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: "bold",
    fontSize: 90,
    distortion: 4.5,
    flowSpeed: 3.5,
    glowIntensity: 5.5,
    colorPreset: 'deepspace',
    backgroundColor: '#000000',
    motionBlur: 4.2,
    noiseScale: 3.8,
    audioSensitivity: 5.0,
    enableBeatGlitches: true,
  });

  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis>({
    volume: 0,
    bass: 0,
    mid: 0,
    high: 0,
    isBeat: false,
    beatIntensity: 0,
  });

  const [isMicActive, setIsMicActive] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showWelcomeTip, setShowWelcomeTip] = useState(true);

  // Audio Engine and HTML5 Audio reference
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const welcomeRevokedRef = useRef<boolean>(false);

  // Initialize Audio Engine on first interaction to comply with browser autoplay constraints
  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.cleanup();
      }
    };
  }, []);

  // Frame synchronization to poll audio spectral analysis continuously
  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      if (audioEngineRef.current) {
        // Poll analyzing nodes
        const analysis = audioEngineRef.current.update(settings.audioSensitivity);
        setAudioAnalysis({ ...analysis });
      }
      requestAnimationFrame(tick);
    };
    tick();

    return () => {
      active = false;
    };
  }, [settings.audioSensitivity]);

  // Handle local microphone activation
  const toggleMicrophone = async () => {
    if (!audioEngineRef.current) return;

    if (isMicActive) {
      audioEngineRef.current.disconnectMicrophone();
      setIsMicActive(false);
    } else {
      // Disconnect file playing before connecting mic
      if (isAudioPlaying && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setIsAudioPlaying(false);
      }
      
      const success = await audioEngineRef.current.connectMicrophone();
      if (success) {
        setIsMicActive(true);
        setAudioFileName(null); // Clear current file playing state
        revokeWelcomeTip();
      } else {
        alert("麦克风启动失败，请检查是否已在浏览器中授予音频录制权限。");
      }
    }
  };

  // Handle local audio file loading (.mp3 etc)
  const handleAudioFileChange = (file: File) => {
    if (!audioEngineRef.current || !audioPlayerRef.current) return;

    // Disconnect mic if active
    if (isMicActive) {
      audioEngineRef.current.disconnectMicrophone();
      setIsMicActive(false);
    }

    // Revoke previous URL to avoid leaks
    if (audioPlayerRef.current.src) {
      URL.revokeObjectURL(audioPlayerRef.current.src);
    }

    const fileUrl = URL.createObjectURL(file);
    audioPlayerRef.current.src = fileUrl;
    setAudioFileName(file.name);
    
    // Connect to engine and autoplay
    audioEngineRef.current.connectAudioElement(audioPlayerRef.current);
    audioPlayerRef.current.play()
      .then(() => {
        setIsAudioPlaying(true);
        revokeWelcomeTip();
      })
      .catch(err => {
        console.error("Autoplay failed:", err);
        setIsAudioPlaying(false);
      });
  };

  // Close welcome notification once audio sources are connected or screen is clicked
  const revokeWelcomeTip = () => {
    if (!welcomeRevokedRef.current) {
      setShowWelcomeTip(false);
      welcomeRevokedRef.current = true;
      // Resume context if suspended
      if (audioEngineRef.current) {
        audioEngineRef.current.resumeContext();
      }
    }
  };

  // Fullscreen support combining iframe compatibility overlays
  const toggleFullScreen = () => {
    const container = document.getElementById('vj-stage-canvas-wrapper');
    if (!container) return;

    if (isFullScreen) {
      // Deactivate fullscreen state
      setIsFullScreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      setIsFullScreen(true);
      // Attempt browser standard full screen, failure is expected/harmless inside nested sandboxed iframes
      container.requestFullscreen().catch(() => {
        console.log("Iframe holds sandbox policy, fallback smoothly to fixed overlay viewport");
      });
    }
  };

  // Listen to native escape fullscreen commands to trigger visual state corrections
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden select-none font-sans flex flex-col md:flex-row bg-zinc-950 text-zinc-200"
      onPointerDown={revokeWelcomeTip}
    >
      {/* Background Glow Aura from Bold Typography design concept */}
      <div className="absolute inset-0 opacity-25 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,69,0,0.18),_transparent_75%)]"></div>
      </div>

      {/* 1. Main Interactive VJ Display Node */}
      <div 
        id="vj-stage-canvas-wrapper"
        className={`flex-1 relative bg-black ${isFullScreen ? 'fixed inset-0 z-40 w-screen h-screen' : 'w-full h-full'}`}
      >
        <VJVisualizer 
          settings={settings}
          audioAnalysis={audioAnalysis}
          isFullScreen={isFullScreen}
        />

        {/* Dynamic VJ Status Bar overlays (Ambient Stage Aesthetic) */}
        {!isFullScreen && (
          <div id="vj-top-decoration" className="absolute top-4 left-4 z-10 pointer-events-none select-none flex items-center gap-3 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium tracking-wide">
              <span className={`w-2 h-2 rounded-full ${isMicActive || isAudioPlaying ? 'bg-orange-500 animate-pulse ring-4 ring-orange-500/25' : 'bg-zinc-500'}`} />
              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-100 font-bold">
                {isMicActive ? "MIC LIVE" : isAudioPlaying ? "TRACK DECK" : "STAGE STANDBY"}
              </span>
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
              <Headphones size={11} className="text-orange-400" />
              <span>{audioFileName ? "COMPLETED" : "CLICK SCREEN TO DISPLACE UNIVERSE"}</span>
            </div>
          </div>
        )}

        {/* Real-time responsive FFT visualizer overlay (Matching Designer Theme) */}
        {!isFullScreen && (
          <footer id="vj-bottom-audio-bar-chart" className="absolute bottom-6 left-6 z-10 flex items-end gap-1.5 select-none pointer-events-none bg-zinc-950/40 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
            <div className="h-2 w-1.5 rounded bg-orange-500/80 transition-all duration-75" style={{ height: `${Math.max(4, audioAnalysis.bass * 28)}px` }}></div>
            <div className="h-4 w-1.5 rounded bg-orange-400 transition-all duration-75" style={{ height: `${Math.max(6, audioAnalysis.volume * 40)}px` }}></div>
            <div className="h-8 w-1.5 rounded bg-amber-400 transition-all duration-75" style={{ height: `${Math.max(10, audioAnalysis.mid * 46)}px` }}></div>
            <div className="h-5 w-1.5 rounded bg-white transition-all duration-75" style={{ height: `${Math.max(6, audioAnalysis.bass * 34)}px` }}></div>
            <div className="h-10 w-1.5 rounded bg-cyan-400 transition-all duration-75" style={{ height: `${Math.max(12, audioAnalysis.high * 52)}px` }}></div>
            <div className="h-12 w-1.5 rounded bg-cyan-400 transition-all duration-75" style={{ height: `${Math.max(14, audioAnalysis.volume * 60)}px` }}></div>
            <div className="h-6 w-1.5 rounded bg-cyan-500/80 transition-all duration-75" style={{ height: `${Math.max(8, audioAnalysis.mid * 36)}px` }}></div>
            <div className="h-2 w-1.5 rounded bg-zinc-600/80 transition-all duration-75" style={{ height: `${Math.max(4, audioAnalysis.high * 22)}px` }}></div>
            <span className="ml-3 text-[9px] uppercase tracking-[0.2em] font-mono font-bold text-zinc-400">Real-time FFT Analysis</span>
          </footer>
        )}

        {/* Fluid Floating Ambient Instructions Badge */}
        {showWelcomeTip && (
          <div id="vj-welcome-badge" className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none max-w-sm w-[85%] text-center p-5 rounded-2xl border border-orange-500/30 backdrop-blur-xl bg-zinc-950/85 shadow-2xl animate-fade">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 mx-auto mb-3">
              <Layers size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase mb-1">液化流体 VJ 视觉实验室</h2>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
              在屏幕中任意拖拽手指或鼠标触发热敏融浪。通过连接麦克风或载入你的音轨，让文字与低重音、高频音拍完美同频液化变形。
            </p>
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMicrophone();
                }}
                className="w-full py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-zinc-950 text-xs font-bold leading-none select-none flex items-center justify-center gap-1 cursor-pointer pointer-events-auto active:scale-95 transition-all"
              >
                <Mic size={12} fill="#0d0d12" />
                <span>连接麦克风拾音</span>
              </button>
              <div className="text-[9px] text-zinc-500 font-mono">
                [ 或直接在右侧菜单上传你的专属高爆 mp3 歌曲 ]
              </div>
            </div>
            {/* Direct close link */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowWelcomeTip(false);
              }}
              className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-300 pointer-events-auto cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Unified Controls Component */}
      <ControlPanel 
        settings={settings}
        setSettings={setSettings}
        audioAnalysis={audioAnalysis}
        isMicActive={isMicActive}
        toggleMicrophone={toggleMicrophone}
        onAudioFileChange={handleAudioFileChange}
        audioFileName={audioFileName}
        audioPlayerRef={audioPlayerRef}
        isAudioPlaying={isAudioPlaying}
        setIsAudioPlaying={setIsAudioPlaying}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
      />
    </div>
  );
}
