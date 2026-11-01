import React from 'react';

interface AudioWaveformProps {
  frequencies: number[];
  isRecording: boolean;
  barColor?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  frequencies,
  isRecording,
  barColor = '#FF5E36',
}) => {
  const bars = frequencies.length > 0 ? frequencies : [15, 30, 20, 50, 25, 40, 18, 32, 45, 20, 28, 16];

  return (
    <div className="flex items-center justify-center gap-1.5 h-12 px-4 py-2 bg-cream-100/80 rounded-2xl border border-cream-200">
      {bars.map((freq, idx) => {
        // Height between 8px and 40px
        const height = isRecording ? Math.max(8, Math.min(42, (freq / 100) * 42)) : 8;
        return (
          <span
            key={idx}
            className="w-1.5 rounded-full transition-all duration-75"
            style={{
              height: `${height}px`,
              backgroundColor: isRecording ? barColor : '#C7B79E',
            }}
          />
        );
      })}
    </div>
  );
};
