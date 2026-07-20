import { useRef, useState } from 'react';
import { uploadVoiceMessage } from '../services/voiceUpload';

interface Props {
  value?: string;
  onChange: (url: string | undefined) => void;
  /** groups uploaded files under a stable path even before a share code exists */
  draftId: string;
}

export default function VoiceRecorder({ value, onChange, draftId }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await handleUpload(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError('Microphone access was denied or unavailable.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function handleUpload(blob: Blob) {
    setBusy(true);
    setError(null);
    try {
      const url = await uploadVoiceMessage(blob, draftId);
      onChange(url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="flex-1 min-w-[220px] flex flex-col">
      <label className="text-[11px] tracking-wide mb-1" style={{ color: 'var(--app-muted)' }}>
        Voice message (optional)
      </label>

      {value ? (
        <div className="flex items-center gap-2.5 flex-wrap">
          <audio controls src={value} className="h-9" style={{ maxWidth: 220 }} />
          <button
            type="button"
            className="text-xs underline"
            style={{ color: 'var(--app-text)' }}
            onClick={() => onChange(undefined)}
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={busy}
            className="text-xs tracking-wide px-3.5 py-2"
            style={{
              background: recording ? '#A65E6A' : 'var(--app-btn-bg)',
              color: 'var(--app-btn-text)',
              border: 'none',
            }}
          >
            {recording ? 'Stop recording' : busy ? 'Uploading…' : 'Record a message'}
          </button>
          <span className="text-xs" style={{ color: 'var(--app-muted)' }}>or</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="text-xs tracking-wide px-3.5 py-2"
            style={{ background: 'transparent', color: 'var(--app-text)', border: '1px solid var(--app-text)' }}
          >
            Upload audio file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFilePicked}
          />
        </div>
      )}
      {error && <p className="text-[11px] mt-1.5" style={{ color: '#A65E6A' }}>{error}</p>}
    </div>
  );
}
