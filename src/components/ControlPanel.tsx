/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { VisualSettings, AudioAnalysis } from '../types';
import { 
  Music, Mic, Volume2, Play, Pause, Maximize2, Minimize2, 
  ChevronDown, ChevronUp, Upload, Type, Sliders, Palette, 
  Activity, Info, Sparkles, FolderOpen
} from 'lucide-react';

interface Props {
  settings: VisualSettings;
  setSettings: React.Dispatch<React.SetStateAction<VisualSettings>>;
  audioAnalysis: AudioAnalysis;
  isMicActive: boolean;
  toggleMicrophone: () => Promise<void>;
  onAudioFileChange: (file: File) => void;
  audioFileName: string | null;
  audioPlayerRef: React.RefObject<HTMLAudioElement | null>;
  isAudioPlaying: boolean;
  setIsAudioPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

export const ControlPanel: React.FC<Props> = ({
  settings,
  setSettings,
  audioAnalysis,
  isMicActive,
  toggleMicrophone,
  onAudioFileChange,
  audioFileName,
  audioPlayerRef,
  isAudioPlaying,
  setIsAudioPlaying,
  isFullScreen,
  toggleFullScreen,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'text' | 'visual' | 'colors' | 'audio'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio timeline seeker calculation
  const audioEl = audioPlayerRef.current;
  const [audioProgress, setAudioProgress] = useState(0);

  const handleAudioTimeUpdate = () => {
    if (audioEl) {
      setAudioProgress((audioEl.currentTime / audioEl.duration) * 100 || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioEl && audioEl.duration) {
      const pct = parseFloat(e.target.value) / 100;
      audioEl.currentTime = audioEl.duration * pct;
      setAudioProgress(e.target.value as any);
    }
  };

  const togglePlayFile = () => {
    if (!audioEl) return;
    if (isAudioPlaying) {
      audioEl.pause();
      setIsAudioPlaying(false);
    } else {
      audioEl.play().catch(console.error);
      setIsAudioPlaying(true);
    }
  };

  // Helper to change individual setting
  const updateSetting = <K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Color preset descriptions
  const presetsInfo = {
    deepspace: { name: '深渊流光', desc: '星云紫海、电光深空青、流浪恒星璀璨白。', colors: ['#00c3d9', '#a605f5', '#ffffff'] },
  };

  return (
    <div
      id="vj-control-panel"
      className={`fixed ${isFullScreen ? 'bottom-4 right-4 z-50 max-w-[340px]' : 'top-4 right-4 z-50 max-w-[380px]'} w-full transition-all duration-300 md:opacity-95 hover:opacity-100`}
    >
      {/* Trigger Fold Button */}
      <div className="flex justify-end mb-2">
        <button
          id="panel-fold-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium backdrop-blur-md bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          {isOpen ? (
            <>
              <ChevronUp size={13} className="animate-pulse" />
              <span>收起控制台</span>
            </>
          ) : (
            <>
              <ChevronDown size={13} className="animate-pulse" />
              <span>展开控制台</span>
            </>
          )}
        </button>
      </div>

      {/* Main Panel Content with blur effect */}
      <div
        id="panel-content-body"
        className={`w-full overflow-hidden transition-all duration-300 rounded-2xl border border-white/10 backdrop-blur-2xl bg-neutral-950/85 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
          isOpen ? 'max-h-[85vh] opacity-100 scale-100' : 'max-h-0 opacity-0 scale-95 pointer-events-none'
        } flex flex-col`}
      >
        {/* Header Indicator / Audio Monitor */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-neutral-950 to-neutral-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-5 h-5 rounded-md bg-orange-500/10 text-orange-400">
              <Sparkles size={12} className="animate-ping absolute" />
              <Activity size={12} />
            </div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-tight text-white">液化重金 VJ 引擎</h1>
              <p className="text-[9px] text-neutral-400 font-mono tracking-wider">LIQUID METAL VJ ENGINE</p>
            </div>
          </div>
          
          <button
            id="vj-fullscreen-btn"
            onClick={toggleFullScreen}
            title={isFullScreen ? '退出全屏' : '全屏展示'}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* Live Audio Visualizer Bar at panel top */}
        <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-2 text-[10px] font-mono text-neutral-400">
          <span className="w-8 uppercase tracking-tighter text-neutral-500 font-bold">Volume</span>
          <div className="flex-1 h-1.5 rounded-full bg-neutral-900 overflow-hidden relative border border-white/5">
            <div 
              className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-orange-500 to-cyan-400"
              style={{ width: `${audioAnalysis.volume * 100}%` }}
            />
            {audioAnalysis.isBeat && settings.enableBeatGlitches && (
              <div className="absolute inset-0 bg-cyan-400 animate-ping opacity-60" />
            )}
          </div>
          <span className="w-12 text-right text-orange-400 font-bold uppercase truncate">
            {audioAnalysis.isBeat && settings.enableBeatGlitches ? '⚡ BEAT' : `VOL:${Math.floor(audioAnalysis.volume * 100)}`}
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 bg-black/40">
          {[
            { id: 'text', label: '文字', icon: Type },
            { id: 'visual', label: '形态', icon: Sliders },
            { id: 'colors', label: '色彩', icon: Palette },
            { id: 'audio', label: '声控', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
              }`}
            >
              <tab.icon size={11} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Panel Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[55vh] custom-scrollbar scroll-smooth">
          
          {/* TAB 1: TEXT SETTINGS */}
          {activeTab === 'text' && (
            <div className="space-y-4 animation-fade">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1">
                  <span>Display Text</span>
                  <span className="text-[9px] text-neutral-500 font-mono">(支持换行)</span>
                </label>
                <textarea
                  value={settings.text}
                  onChange={(e) => updateSetting('text', e.target.value)}
                  placeholder="输入你想要液化的文字..."
                  className="w-full h-20 p-2.5 text-xs text-zinc-150 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none resize-none transition-all font-sans font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">字体家族</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => updateSetting('fontFamily', e.target.value)}
                    className="w-full p-2 text-xs text-neutral-200 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-500 outline-none cursor-pointer font-bold"
                  >
                    <option value="'Space Grotesk', sans-serif">赛博几何 (Space)</option>
                    <option value="'Outfit', sans-serif">前卫圆滑 (Outfit)</option>
                    <option value="'JetBrains Mono', monospace">黑客编程 (Mono)</option>
                    <option value="'Playfair Display', serif">古典优雅 (Serif)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">字形粗细</label>
                  <select
                    value={settings.fontWeight}
                    onChange={(e) => updateSetting('fontWeight', e.target.value)}
                    className="w-full p-2 text-xs text-neutral-200 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-500 outline-none cursor-pointer font-bold"
                  >
                    <option value="300">细体 (300)</option>
                    <option value="normal">常规 (Normal)</option>
                    <option value="bold">粗体 (Bold)</option>
                    <option value="900">特粗 (Black 900)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  <span>Display Font Size</span>
                  <span className="font-mono text-cyan-400">{settings.fontSize}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1 rounded bg-neutral-800"
                />
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL DEFORMATION */}
          {activeTab === 'visual' && (
            <div className="space-y-4 animation-fade">
              {/* Distortion */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  <span>Distortion Strength</span>
                  <span className="font-mono text-cyan-400">{settings.distortion.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={settings.distortion}
                  onChange={(e) => updateSetting('distortion', parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1 rounded bg-neutral-800"
                />
              </div>

              {/* Noise Scale (Wave Frequency) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  <span>Fluid Flow Velocity</span>
                  <span className="font-mono text-cyan-400">{settings.noiseScale.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.1"
                  value={settings.noiseScale}
                  onChange={(e) => updateSetting('noiseScale', parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1 rounded bg-neutral-800"
                />
              </div>

              {/* Flow Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  <span>Wave Speed</span>
                  <span className="font-mono text-cyan-400">{settings.flowSpeed.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={settings.flowSpeed}
                  onChange={(e) => updateSetting('flowSpeed', parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1 rounded bg-neutral-800"
                />
              </div>

              {/* Glow Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  <span>Glow Intensity</span>
                  <span className="font-mono text-cyan-400">{settings.glowIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={settings.glowIntensity}
                  onChange={(e) => updateSetting('glowIntensity', parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1 rounded bg-neutral-800"
                />
              </div>

              {/* Motion Blur (Residual Trail) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  <span>Motion Blur Trails</span>
                  <span className="font-mono text-cyan-400">{settings.motionBlur.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={settings.motionBlur}
                  onChange={(e) => updateSetting('motionBlur', parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1 rounded bg-neutral-800"
                />
              </div>
            </div>
          )}

          {/* TAB 3: COLOR PALETTES */}
          {activeTab === 'colors' && (
            <div className="space-y-4 animation-fade">
              <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">色彩组合配置</label>
              
              <div className="space-y-2.5">
                {(Object.keys(presetsInfo) as Array<keyof typeof presetsInfo>).map(presetKey => {
                  const info = presetsInfo[presetKey];
                  const isActive = settings.colorPreset === presetKey;
                  return (
                    <button
                       key={presetKey}
                       onClick={() => updateSetting('colorPreset', presetKey)}
                       className={`w-full p-3 rounded-xl border flex flex-col text-left transition-all active:scale-98 cursor-pointer ${
                         isActive 
                           ? 'bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/5' 
                           : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-neutral-900/50'
                       }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-orange-400' : 'text-zinc-200'}`}>
                          {info.name}
                        </span>
                        {/* Preset preview color dots */}
                        <div className="flex items-center gap-1">
                          {info.colors.map((c, i) => (
                            <span 
                              key={i} 
                              className="w-3 h-3 rounded-full border border-neutral-950 shadow-inner" 
                              style={{ backgroundColor: c }} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{info.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Background Color Picker */}
              <div className="space-y-2.5 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">背景底色</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateSetting('backgroundColor', '#000000')}
                      className={`px-2 py-0.5 text-[9px] font-bold font-mono uppercase tracking-tighter rounded border cursor-pointer transition-colors ${
                        settings.backgroundColor === '#000000' 
                          ? 'border-orange-500 text-orange-400 bg-orange-500/10' 
                          : 'border-white/10 text-neutral-400 bg-white/5 hover:text-white'
                      }`}
                    >
                      Void Black
                    </button>
                    <button
                      onClick={() => updateSetting('backgroundColor', '#05020c')}
                      className={`px-2 py-0.5 text-[9px] font-bold font-mono uppercase tracking-tighter rounded border cursor-pointer transition-colors ${
                        settings.backgroundColor === '#05020c' 
                          ? 'border-orange-500 text-orange-400 bg-orange-500/10' 
                          : 'border-white/10 text-neutral-400 bg-white/5 hover:text-white'
                      }`}
                    >
                      Neon Dark
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent border border-white/10 cursor-pointer overflow-hidden p-0"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                    className="flex-1 bg-black/50 text-xs px-2.5 py-1.5 border border-white/10 rounded-lg text-neutral-200 font-mono uppercase font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIO CONTROL & FILE INPUT */}
          {activeTab === 'audio' && (
            <div className="space-y-4 animation-fade">
              {/* Signal Controls */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="mic-connect-btn"
                  onClick={toggleMicrophone}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold active:scale-95 cursor-pointer ${
                    isMicActive
                      ? 'bg-red-500/15 border-red-500 text-red-400 shadow-md shadow-red-500/5'
                      : 'bg-black/50 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-neutral-900/50'
                  }`}
                >
                  <Mic size={15} className={isMicActive ? 'animate-bounce text-red-500' : ''} />
                  <span>{isMicActive ? '停止麦克风' : '麦克风拾音'}</span>
                </button>

                <button
                  id="file-trigger-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold active:scale-95 cursor-pointer ${
                    audioFileName
                      ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5'
                      : 'bg-black/50 border-white/10 text-zinc-300 hover:border-white/20 hover:bg-neutral-900/50'
                  }`}
                >
                  <FolderOpen size={15} className={audioFileName ? 'text-orange-500' : ''} />
                  <span>{audioFileName ? '重选音乐' : '上传音轨(.mp3)'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onAudioFileChange(file);
                    }
                  }}
                  accept="audio/*"
                  className="hidden"
                />
              </div>

              {/* Local Audio File Player Bar */}
              {audioFileName && (
                <div id="vj-audio-player-container" className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 truncate max-w-[70%] font-mono font-bold">
                      <Music size={11} className="text-orange-500 animate-pulse shrink-0" />
                      <span className="truncate" title={audioFileName}>{audioFileName}</span>
                    </div>
                    <span className="text-[9px] text-neutral-500 font-mono uppercase font-bold">LOADED</span>
                  </div>

                  {/* Playback Progress */}
                  <div className="flex items-center gap-2">
                    <button
                      id="vj-music-play-btn"
                      onClick={togglePlayFile}
                      className="p-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 rounded-lg transition-transform active:scale-90 cursor-pointer shrink-0"
                    >
                      {isAudioPlaying ? <Pause size={12} fill="#0d0d12" /> : <Play size={12} fill="#0d0d12" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.05"
                      value={audioProgress}
                      onChange={handleSeek}
                      className="flex-1 accent-orange-500 h-1 rounded bg-neutral-800 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Audio Controls settings */}
              <div className="space-y-4 pt-3 border-t border-white/5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                    <span>Audio Sensitivity</span>
                    <span className="font-mono text-cyan-400">{settings.audioSensitivity.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={settings.audioSensitivity}
                    onChange={(e) => updateSetting('audioSensitivity', parseFloat(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1 rounded bg-neutral-800"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-white/10">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white uppercase tracking-tight">Beat Glitches</span>
                    <span className="text-[9px] text-neutral-500">重低音显著时瞬间错位、残影</span>
                  </div>
                  <button
                    onClick={() => updateSetting('enableBeatGlitches', !settings.enableBeatGlitches)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      settings.enableBeatGlitches
                        ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                        : 'border-white/10 text-neutral-400 bg-white/5 hover:text-white'
                    }`}
                  >
                    {settings.enableBeatGlitches ? '已开启' : '已关闭'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mini Interactive info tip */}
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 flex items-start gap-2 text-[10px] text-neutral-400">
            <Info size={12} className="text-neutral-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-sans">
              <strong>舞台 VJ 触控交互:</strong> 支持手机端与电脑端拖拽。在画面中间拖曳，即可在指间引发热成像涟漪波澜。配合音乐播放，效果更佳。
            </p>
          </div>

        </div>

        {/* Footer info showing WebGL metrics */}
        <div className="p-3 bg-black/80 border-t border-white/5 text-center flex items-center justify-between text-[9px] font-mono text-neutral-500 px-4">
          <span className="font-bold tracking-wider">COOPERATING STAGE FX V1.2</span>
          <span className="font-bold text-white tracking-wider">BASS ENERGY: {Math.floor(audioAnalysis.bass * 100)}%</span>
        </div>
      </div>

      {/* Hidden native audio element */}
      <audio
        ref={audioPlayerRef}
        id="native-vj-audio-player"
        crossOrigin="anonymous"
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={() => setIsAudioPlaying(false)}
        loop
        className="hidden"
      />
    </div>
  );
};
