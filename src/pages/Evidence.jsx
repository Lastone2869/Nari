import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { addEvidence, getUserEvidence } from '../firebase/firestore';
import { uploadEvidence } from '../firebase/storage';
import { fmtSize } from '../lib/format';
import { Upload, Lock, CheckCircle, FileImage, FileVideo, File, Copy, ExternalLink, Shield, AlertCircle } from 'lucide-react';

const MAX_FILE_BYTES = 50 * 1024 * 1024; // mirrored in storage.rules

function FileIcon({ type }) {
  if (type?.startsWith('image')) return <FileImage size={18} className="text-nari-navy" />;
  if (type?.startsWith('video')) return <FileVideo size={18} className="text-nari-coral" />;
  return <File size={18} className="text-gray-500" />;
}

function EvidenceCard({ ev }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(ev.hash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const ts = ev.createdAt?.toDate?.()?.toLocaleString?.() || 'Uploading...';

  return (
    <div className="zomato-card p-5 transition-all hover:border-nari-navy/30">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-nari-navy/20 bg-nari-navy/10">
          <FileIcon type={ev.fileType} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-nari-navy">{ev.fileName}</div>
          <div className="mt-0.5 text-xs font-medium text-gray-600">{fmtSize(ev.fileSize)} | {ts}</div>
        </div>
        <span className="flex-shrink-0 rounded-lg border border-nari-teal/30 bg-nari-teal/10 px-2 py-1 text-xs font-bold text-[#0A6B63]">
          Hashed
        </span>
      </div>

      <div className="rounded-xl border border-nari-navy/5 bg-gray-100 p-3 shadow-inner">
        <div className="mb-1 flex items-center gap-1">
          <Shield size={11} className="text-nari-navy" />
          <span className="text-xs font-bold uppercase tracking-wider text-nari-navy">SHA-256 Hash</span>
        </div>
        <div className="flex items-center gap-3">
          <code className="flex-1 truncate font-mono text-xs font-semibold text-gray-600">{ev.hash}</code>
          <button onClick={copy} aria-label="Copy hash" className="-m-1.5 flex-shrink-0 p-1.5 text-gray-500 transition-colors hover:text-nari-navy">
            {copied ? <CheckCircle size={14} className="text-nari-teal" /> : <Copy size={14} />}
          </button>
          {ev.fileUrl && (
            <a href={ev.fileUrl} target="_blank" rel="noreferrer" aria-label={`Open ${ev.fileName}`} className="-m-1.5 flex-shrink-0 p-1.5 text-gray-500 transition-colors hover:text-nari-navy">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {ev.reportId && ev.reportId !== 'general' && (
        <div className="mt-2 text-xs font-medium text-gray-600">
          Linked to Report: <span className="font-mono font-bold text-nari-navy">{ev.reportId}</span>
        </div>
      )}
    </div>
  );
}

export default function Evidence() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    return getUserEvidence(user.uid, setEvidence);
  }, [user]);

  const handleFiles = (list) => {
    const all = Array.from(list);
    const ok = all.filter((f) => f.size <= MAX_FILE_BYTES);
    setError(ok.length < all.length ? `${all.length - ok.length} file(s) skipped: larger than 50 MB.` : '');
    setFiles(ok);
  };

  const upload = async () => {
    if (!files.length || !user) return;
    setUploading(true);
    setProgress(0);
    setError('');
    const failed = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const result = await uploadEvidence(f, user.uid);
        await addEvidence({
          userId: user.uid,
          fileName: f.name,
          fileSize: f.size,
          fileType: f.type,
          fileUrl: result.url,
          hash: result.hash,
          storagePath: result.path,
          reportId: 'general',
        });
      } catch (e) {
        console.error('Upload error:', e);
        failed.push(f);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    if (failed.length) setError(`${failed.length} of ${files.length} file(s) failed to upload. They are kept below so you can retry.`);
    setFiles(failed);
    setUploading(false);
  };

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center bg-gray-50/50 px-4 pb-10 pt-24">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight text-nari-navy">Evidence Locker</h1>
          <p className="text-base text-gray-600">Upload files and generate a SHA-256 hash for tamper-proof verification.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { step: '01', label: 'Upload File', desc: 'Any image, video, or document' },
            { step: '02', label: 'Hash Generated', desc: 'SHA-256 fingerprint created' },
            { step: '03', label: 'Stored Securely', desc: 'Tamper-proof and verifiable' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="zomato-card bg-white p-5 text-center">
              <div className="mb-1 text-3xl font-black text-nari-navy/60">{step}</div>
              <div className="mb-1 text-sm font-bold text-nari-navy">{label}</div>
              <div className="text-xs font-medium text-gray-500">{desc}</div>
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" /> {error}
          </div>
        )}

        <div className="zomato-card mb-8 bg-white p-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                drag ? 'border-nari-navy bg-nari-navy/5' : 'border-nari-navy/20 bg-white hover:border-nari-navy/40 hover:bg-gray-50'
              }`}
            >
              <Upload size={32} className="mx-auto mb-3 text-nari-navy opacity-80" />
              <p className="mb-1 font-bold text-nari-navy">Drop files here or click to browse</p>
              <p className="mb-4 text-sm font-medium text-gray-500">Images, videos, PDFs supported</p>
              <input
                id="evidence-upload"
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
              <label htmlFor="evidence-upload" className="mt-2 inline-block cursor-pointer rounded-xl border border-nari-navy/40 bg-nari-navy px-6 py-3 text-base font-bold text-white transition-all hover:bg-[#132846] hover:shadow-md">
                Browse Files
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-nari-navy/10 bg-white p-3 shadow-sm">
                    <FileIcon type={f.type} />
                    <span className="flex-1 truncate text-sm font-bold text-nari-navy">{f.name}</span>
                    <span className="text-xs font-semibold text-gray-500">{fmtSize(f.size)}</span>
                  </div>
                ))}
                {uploading ? (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs font-bold text-nari-navy">
                      <span>Uploading and hashing...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-nari-navy/10">
                      <div className="h-full rounded-full bg-nari-teal transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    id="upload-evidence-btn"
                    onClick={upload}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-nari-navy py-3 font-semibold text-white transition-all hover:bg-[#132846] hover:shadow-md"
                  >
                    <Lock size={16} />
                    Secure Upload ({files.length} file{files.length > 1 ? 's' : ''})
                  </button>
                )}
              </div>
            )}
          </div>

        {evidence.length > 0 && (
          <div>
            <h2 className="mb-4 font-bold text-nari-navy">Your Evidence Vault ({evidence.length})</h2>
            <div className="space-y-3">
              {evidence.map((ev) => (
                <EvidenceCard key={ev.id} ev={ev} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
