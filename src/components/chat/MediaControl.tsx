'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface MediaDevice {
  deviceId: string;
  kind: string;
  label: string;
  groupId?: string;
}

interface Props {
  onDeviceChange?: (deviceId: string, kind: 'audioinput' | 'videoinput') => void;
  onSettingsChange?: (settings: MediaSettings) => void;
  isStreaming: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onScreenShareToggle: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  audioLevel?: number;
  onVolumeChange?: (volume: number) => void;
  className?: string;
}

interface MediaSettings {
  audioDeviceId: string;
  videoDeviceId: string;
  audioQuality: 'low' | 'medium' | 'high';
  videoQuality: 'low' | 'medium' | 'high';
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export default function MediaControls({
  onDeviceChange,
  onSettingsChange,
  isStreaming,
  onMicToggle,
  onCameraToggle,
  onScreenShareToggle,
  isMicOn,
  isCameraOn,
  isScreenSharing,
  audioLevel = 50,
  onVolumeChange,
  className = ""
}: Props) {
  const [devices, setDevices] = useState<MediaDevice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<MediaSettings>({
    audioDeviceId: '',
    videoDeviceId: '',
    audioQuality: 'medium',
    videoQuality: 'medium',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevelMeter, setAudioLevelMeter] = useState(0);

  // Get available media devices
  const updateDevices = useCallback(async () => {
    try {
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {
          // Permissions denied, get devices without labels
        });

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const mediaDevices = deviceList
        .filter(device => device.kind === 'audioinput' || device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          kind: device.kind,
          label: device.label || `${device.kind} (${device.deviceId.slice(0, 8)}...)`,
          groupId: device.groupId
        }));

      setDevices(mediaDevices);

      // Set default devices if not set
      if (!settings.audioDeviceId) {
        const defaultAudio = mediaDevices.find(d => d.kind === 'audioinput');
        if (defaultAudio) {
          setSettings(prev => ({ ...prev, audioDeviceId: defaultAudio.deviceId }));
        }
      }

      if (!settings.videoDeviceId) {
        const defaultVideo = mediaDevices.find(d => d.kind === 'videoinput');
        if (defaultVideo) {
          setSettings(prev => ({ ...prev, videoDeviceId: defaultVideo.deviceId }));
        }
      }
    } catch (err) {
      console.error('Error getting media devices:', err);
      toast.error('Could not get media devices');
    }
  }, [settings.audioDeviceId, settings.videoDeviceId]);

  // Listen for device changes
  useEffect(() => {
    updateDevices();

    const handleDeviceChange = () => {
      updateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [updateDevices]);

  // Audio level monitoring
  useEffect(() => {
    if (!isMicOn || !isStreaming) {
      setAudioLevelMeter(0);
      return;
    }

    let animationFrame: number;
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;

    const startAudioMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: settings.audioDeviceId || undefined },
        });

        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 512;
        analyser.minDecibels = -127;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = 0.4;
        
        microphone.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const level = (average / 255) * 100;
          setAudioLevelMeter(Math.min(level, 100));
          
          animationFrame = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();
      } catch (err) {
        console.error('Error starting audio monitoring:', err);
      }
    };

    startAudioMonitoring();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isMicOn, isStreaming, settings.audioDeviceId]);

  // Handle device selection
  const handleDeviceChange = useCallback((deviceId: string, kind: 'audioinput' | 'videoinput') => {
    if (kind === 'audioinput') {
      setSettings(prev => ({ ...prev, audioDeviceId: deviceId }));
    } else {
      setSettings(prev => ({ ...prev, videoDeviceId: deviceId }));
    }
    
    onDeviceChange?.(deviceId, kind);
  }, [onDeviceChange]);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: Partial<MediaSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  }, [settings, onSettingsChange]);

  // Test audio device
  const testAudioDevice = useCallback(async () => {
    if (isTestingAudio) return;
    
    setIsTestingAudio(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: settings.audioDeviceId || undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
        },
      });

      // Create a temporary audio element to test
      const audio = new Audio();
      audio.srcObject = stream;
      audio.volume = 0.1;
      
      // Stop after 3 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        setIsTestingAudio(false);
      }, 3000);
      
      toast.success('Audio test started - speak to test your microphone');
    } catch (err) {
      console.error('Error testing audio:', err);
      toast.error('Failed to test audio device');
      setIsTestingAudio(false);
    }
  }, [isTestingAudio, settings]);

  const audioDevices = devices.filter(d => d.kind === 'audioinput');
  const videoDevices = devices.filter(d => d.kind === 'videoinput');

  return (
    <div className={`bg-gray-800 rounded-lg ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 p-4">
        {/* Microphone with level indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <button
              onClick={onMicToggle}
              className={`p-3 rounded-full transition-colors ${
                isMicOn 
                  ? 'bg-gray-600 hover:bg-gray-500' 
                  : 'bg-red-600 hover:bg-red-500'
              }`}
              title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicOn ? (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            
            {/* Audio level indicator */}
            {isMicOn && isStreaming && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-1 bg-gray-600 rounded">
                  <div 
                    className="h-full bg-green-500 rounded transition-all duration-100"
                    style={{ width: `${audioLevelMeter}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Camera */}
        <button
          onClick={onCameraToggle}
          className={`p-3 rounded-full transition-colors ${
            isCameraOn 
              ? 'bg-gray-600 hover:bg-gray-500' 
              : 'bg-red-600 hover:bg-red-500'
          }`}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>

        {/* Screen Share */}
        <button
          onClick={onScreenShareToggle}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing 
              ? 'bg-blue-600 hover:bg-blue-500' 
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Volume Control */}
        {onVolumeChange && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={audioLevel}
              onChange={(e) => onVolumeChange(parseInt(e.target.value))}
              className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-400 w-8">{audioLevel}%</span>
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
          title="Settings"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t border-gray-700 p-4">
          <div className="space-y-4">
            {/* Device Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Microphone
                </label>
                <div className="flex gap-2">
                  <select
                    value={settings.audioDeviceId}
                    onChange={(e) => handleDeviceChange(e.target.value, 'audioinput')}
                    className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Default</option>
                    {audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={testAudioDevice}
                    disabled={isTestingAudio}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
                  >
                    {isTestingAudio ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Camera
                </label>
                <select
                  value={settings.videoDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value, 'videoinput')}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Default</option>
                  {videoDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quality Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio Quality
                </label>
                <select
                  value={settings.audioQuality}
                  onChange={(e) => handleSettingsChange({ 
                    audioQuality: e.target.value as 'low' | 'medium' | 'high' 
                  })}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="low">Low (32kbps)</option>
                  <option value="medium">Medium (64kbps)</option>
                  <option value="high">High (128kbps)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Video Quality
                </label>
                <select
                  value={settings.videoQuality}
                  onChange={(e) => handleSettingsChange({ 
                    videoQuality: e.target.value as 'low' | 'medium' | 'high' 
                  })}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="low">Low (240p)</option>
                  <option value="medium">Medium (480p)</option>
                  <option value="high">High (720p)</option>
                </select>
              </div>
            </div>

            {/* Audio Processing Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Audio Processing
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.echoCancellation}
                    onChange={(e) => handleSettingsChange({ echoCancellation: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-300">Echo Cancellation</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.noiseSuppression}
                    onChange={(e) => handleSettingsChange({ noiseSuppression: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-300">Noise Suppression</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoGainControl}
                    onChange={(e) => handleSettingsChange({ autoGainControl: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-300">Auto Gain Control</span>
                </label>
              </div>
            </div>

            {/* Device Information */}
            <div className="text-xs text-gray-400 space-y-1">
              <div>Total devices: {devices.length}</div>
              <div>Audio devices: {audioDevices.length}</div>
              <div>Video devices: {videoDevices.length}</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}