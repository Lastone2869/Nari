// src/pages/Evidence.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addEvidence, getUserEvidence } from '../firebase/firestore';
import { uploadEvidence } from '../firebase/storage';
import { Upload, Lock, CheckCircle, FileImage, FileVideo, File, Copy, ExternalLink, Shield } from 'lucide-react';

function FileIcon({ type }) {
  if (type?.startsWith('image')) return <FileImage size={18} className="text-violet-400" />;
  if (type?.startsWith('video')) return <FileVideo size={18} className="text-pink-400" />;
  return <File size={18} className="text-gray-400" />;
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function EvidenceCard({ ev }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(ev.hash); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const ts = ev.createdAt?.toDate?.()?.toLocaleString?.() || 'Uploading…';

  return (
    <div className="glass-card rounded-2xl p-5 hover:border-violet-600/30 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-600/30 flex items-center justify-center flex-shrink-0">
          <FileIcon type={ev.fileType} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm truncate">{ev.fileName}</div>
          <div className="text-gray-500 text-xs mt-0.5">{fmtSize(ev.fileSize)} • {ts}</div>
        </div>
        <span className="px-2 py-1 rounded-lg bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30 flex-shrink-0">
          ✓ Verified
        </span>
      </div>

      {/* Hash row */}
      <div className="bg-black/30 rounded-xl p-3">
        <div className="flex items-center gap-1 mb-1">
          <Shield size={11} className="text-violet-400" />
          <span className="text-xs text-violet-400 font-semibold uppercase tracking-wider">SHA-256 Hash</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs text-gray-400 font-mono truncate flex-1">{ev.hash}</code>
          <button onClick={copy} className="text-gray-500 hover:text-violet-400 flex-shrink-0 transition-colors">
            {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
          {ev.fileUrl && (
            <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-violet-400 flex-shrink-0 transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {ev.reportId && ev.reportId !== 'general' && (
        <div className="mt-2 text-xs text-gray-600">Linked to Report: <span className="text-violet-400 font-mono">{ev.reportId}</span></div>
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

  useEffect(() => {
    if (!user) return;
    return getUserEvidence(user.uid, setEvidence);
  }, [user]);

  const handleFiles = (list) => setFiles(Array.from(list));

  const upload = async () => {
    if (!files.length || !user) return;
    setUploading(true);
    setProgress(0);
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
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setFiles([]);
    setUploading(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 grid-bg">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">Evidence Locker</h1>
          <p className="text-gray-500 text-sm">Upload files — each gets a SHA-256 hash for tamper-proof verification.</p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { step: '01', label: 'Upload File', desc: 'Any image, video, or document' },
            { step: '02', label: 'Hash Generated', desc: 'SHA-256 fingerprint created' },
            { step: '03', label: 'Stored Securely', desc: 'Tamper-proof & verifiable' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="glass-card rounded-xl p-4 text-center">
              <div className="text-violet-500 font-bold text-lg mb-1">{step}</div>
              <div className="text-white font-medium text-sm mb-0.5">{label}</div>
              <div className="text-gray-500 text-xs">{desc}</div>
            </div>
          ))}
        </div>

        {/* Upload area */}
        {user ? (
          <div className="glass-card rounded-3xl p-6 mb-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                drag ? 'border-violet-500 bg-violet-600/10' : 'border-white/15 hover:border-violet-600/40'
              }`}
            >
              <Upload size={32} className="text-violet-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Drop files here or click to browse</p>
              <p className="text-gray-500 text-sm mb-4">Images, videos, PDFs supported</p>
              <input id="evidence-upload" type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
              <label htmlFor="evidence-upload" className="px-5 py-2 rounded-xl bg-violet-600/20 border border-violet-600/40 text-violet-300 text-sm font-medium cursor-pointer hover:bg-violet-600/30 transition-colors">
                Browse Files
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <FileIcon type={f.type} />
                    <span className="text-sm text-gray-300 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-gray-500">{fmtSize(f.size)}</span>
                  </div>
                ))}
                {uploading ? (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Uploading & Hashing…</span><span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full transition-all duration-300" style={{ width: progress + '%' }} />
                    </div>
                  </div>
                ) : (
                  <button id="upload-evidence-btn" onClick={upload}
                    className="w-full mt-2 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
                    <Lock size={16} />
                    Secure Upload ({files.length} file{files.length > 1 ? 's' : ''})
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center mb-6">
            <Lock size={28} className="text-violet-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Sign in to upload evidence</p>
            <p className="text-gray-500 text-sm">Your evidence is encrypted and linked to your account.</p>
          </div>
        )}

        {/* Evidence list */}
        {evidence.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-4">Your Evidence Vault ({evidence.length})</h2>
            <div className="space-y-3">
              {evidence.map((ev) => <EvidenceCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
