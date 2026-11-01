import { AIService } from './aiService';

export interface AudioRecordingState {
  isRecording: boolean;
  duration: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  transcript: string;
  isTranscribing: boolean;
  error: string | null;
}

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: any = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private recognition: any = null;
  private timerInterval: any = null;

  public onTimeUpdate: ((seconds: number) => void) | null = null;
  public onTranscriptUpdate: ((text: string) => void) | null = null;
  public onWaveformUpdate: ((frequencies: number[]) => void) | null = null;
  private animFrameId: number | null = null;

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-IN'; // English (India) / English (US)

        this.recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          if (this.onTranscriptUpdate) {
            this.onTranscriptUpdate(currentTranscript.trim());
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
        };
      } catch (err) {
        console.warn('Speech recognition not available:', err);
      }
    }
  }

  public async startRecording(): Promise<boolean> {
    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio context for waveform
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250);

      // Start live waveform loop
      this.startWaveformLoop();

      // Start timer
      let seconds = 0;
      if (this.onTimeUpdate) this.onTimeUpdate(0);
      this.timerInterval = setInterval(() => {
        seconds++;
        if (this.onTimeUpdate) this.onTimeUpdate(seconds);
      }, 1000);

      // Start speech recognition
      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // might already be started
        }
      }

      return true;
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      return false;
    }
  }

  private startWaveformLoop() {
    const update = () => {
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);
        // Normalize 0-100
        const frequencies = Array.from(this.dataArray.slice(0, 16)).map(
          (val: any) => Math.round((Number(val) / 255) * 100)
        );
        if (this.onWaveformUpdate) {
          this.onWaveformUpdate(frequencies);
        }
      }
      this.animFrameId = requestAnimationFrame(update);
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  public async stopRecording(): Promise<{ audioUrl: string; blob: Blob }> {
    return new Promise((resolve, reject) => {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }

      if (!this.mediaRecorder) {
        return reject(new Error('MediaRecorder not initialized'));
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Stop stream tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }

        resolve({ audioUrl, blob: audioBlob });
      };

      this.mediaRecorder.stop();
    });
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public async transcribeWithWhisper(audioBlob: Blob): Promise<string> {
    const res = await AIService.transcribeAudioWithWhisper(audioBlob);
    if (res.ok && res.text) {
      return res.text;
    }
    return '';
  }
}
