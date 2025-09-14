'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface MediaDevice {
  deviceId: string;
  kind: string;
  label: string;
}

interface Props {
  onDeviceChange?: (deviceId: string, kind: 'audioinput' | 'videoinput') => void;
  isStreaming: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
}

export default function MediaControls({
  onDeviceChange,
  isStreaming,
  onMicToggle,
  onCameraToggle,
  isMicOn,
  isCameraOn
}: Props) {
  const [devices, setDevices] = useState<MediaDevice[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');

  useEffect(() => {
    // Get initial devices
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const mediaDevices = devices.map(device => ({
          deviceId: device.deviceId,
          kind: device.kind,
          label: device.label || `${device.kind} (${device.deviceId})`
        }));
        setDevices(mediaDevices);

        // Set default devices
        const defaultAudio = mediaDevices.find(d => d.kind === 'audioinput');
        const defaultVideo = mediaDevices.find(d => d.kind === 'videoinput');
        
        if (defaultAudio) setSelectedAudioDevice(defaultAudio.deviceId);
        if (defaultVideo) setSelectedVideoDevice(defaultVideo.deviceId);
      })
      .catch(err => {
        console.error('Error getting media devices:', err);
        toast.error('Could not get media devices');
      });

    // Listen for device changes
    navigator.mediaDevices.ondevicechange = () => {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          setDevices(devices.map(device => ({
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label || `${device.kind} (${device.deviceId})`
          })));
        })
        .catch(err => {
          console.error('Error updating media devices:', err);
        });
    };
  }, []);

  const handleAudioDeviceChange = (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    onDeviceChange?.(deviceId, 'audioinput');
  };

  const handleVideoDeviceChange = (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    onDeviceChange?.(deviceId, 'videoinput');
  };

  return (
    <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg">
      {/* Microphone controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onMicToggle}
          className={`p-2 rounded-full ${
            isMicOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
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
        <select
          value={selectedAudioDevice}
          onChange={(e) => handleAudioDeviceChange(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
          disabled={!isStreaming}
        >
          {devices
            .filter(d => d.kind === 'audioinput')
            .map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
        </select>
      </div>

      {/* Camera controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onCameraToggle}
          className={`p-2 rounded-full ${
            isCameraOn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
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
        <select
          value={selectedVideoDevice}
          onChange={(e) => handleVideoDeviceChange(e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
          disabled={!isStreaming}
        >
          {devices
            .filter(d => d.kind === 'videoinput')
            .map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}