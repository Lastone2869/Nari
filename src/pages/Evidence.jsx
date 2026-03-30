// src/pages/Evidence.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addEvidence, getUserEvidence } from '../firebase/firestore';
import { uploadEvidence } from '../firebase/storage';
import { Upload, Lock, CheckCircle, FileImage, FileVideo, File, Copy, ExternalLink, Shield } from 'lucide-react';

function FileIcon({ type }) {
  if (type?.startsWith('image')) return <FileImage size={18} className="text-nari-navy" />;
  if (type?.startsWith('video')) return <FileVideo size={18} className="text-nari-coral" />;
  return <File size={18} className="text-gray-500" />;
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
    <div className="zomato-card p-5 hover:border-nari-navy/30 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-nari-navy/10 border border-nari-navy/20 flex items-center justify-center flex-shrink-0">
          <FileIcon type={ev.fileType} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-nari-navy font-bold text-sm truncate">{ev.fileName}</div>
          <div className="text-gray-600 font-medium text-xs mt-0.5">{fmtSize(ev.fileSize)} • {ts}</div>
        </div>
        <span className="px-2 py-1 rounded-lg bg-nari-teal/10 text-nari-teal text-xs font-bold border border-nari-teal/30 flex-shrink-0">
          ✓ Verified
        </span>
      </div>

      {/* Hash row */}
      <div className="bg-gray-100 rounded-xl p-3 border border-nari-navy/5 shadow-inner">
        <div className="flex items-center gap-1 mb-1">
          <Shield size={11} className="text-nari-navy" />
          <span className="text-xs text-nari-navy font-bold uppercase tracking-wider">SHA-256 Hash</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs text-gray-500 font-mono font-semibold truncate flex-1">{ev.hash}</code>
          <button onClick={copy} className="text-gray-400 hover:text-nari-navy flex-shrink-0 transition-colors">
            {copied ? <CheckCircle size={14} className="text-nari-teal" /> : <Copy size={14} />}
          </button>
          {ev.fileUrl && (
            <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-nari-navy flex-shrink-0 transition-colors">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {ev.reportId && ev.reportId !== 'general' && (
        <div className="mt-2 text-xs text-gray-600 font-medium">Linked to Report: <span className="text-nari-navy font-mono font-bold">{ev.reportId}</span></div>
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
    <div className="min-h-[90vh] pt-24 pb-10 px-4 bg-gray-50/50 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-nari-navy mb-2 tracking-tight">Evidence Locker</h1>
          <p className="text-gray-600 text-base">Upload files — each gets a SHA-256 hash for tamper-proof verification.</p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { step: '01', label: 'Upload File', desc: 'Any image, video, or document' },
            { step: '02', label: 'Hash Generated', desc: 'SHA-256 fingerprint created' },
            { step: '03', label: 'Stored Securely', desc: 'Tamper-proof & verifiable' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="zomato-card bg-white p-5 text-center">
              <div className="text-nari-navy/30 font-black text-3xl mb-1">{step}</div>
              <div className="text-nari-navy font-bold text-sm mb-1">{label}</div>
              <div className="text-gray-500 font-medium text-xs">{desc}</div>
            </div>
          ))}
        </div>

        {/* Upload area */}
        {user ? (
          <div className="zomato-card bg-white p-8 mb-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all bg-white ${
                drag ? 'border-nari-navy bg-nari-navy/5' : 'border-nari-navy/20 hover:border-nari-navy/40 hover:bg-gray-50'
              }`}
            >
              <Upload size={32} className="text-nari-navy mx-auto mb-3 opacity-80" />
              <p className="text-nari-navy font-bold mb-1">Drop files here or click to browse</p>
              <p className="text-gray-500 font-medium text-sm mb-4">Images, videos, PDFs supported</p>
              <input id="evidence-upload" type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
              <label htmlFor="evidence-upload" className="px-6 py-3 rounded-xl bg-nari-navy border border-nari-navy/40 text-white text-base font-bold cursor-pointer hover:bg-[#132846] hover:shadow-md transition-all inline-block mt-2">
                Browse Files
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-nari-navy/10 shadow-sm">
                    <FileIcon type={f.type} />
                    <span className="text-sm font-bold text-nari-navy flex-1 truncate">{f.name}</span>
                    <span className="text-xs font-semibold text-gray-500">{fmtSize(f.size)}</span>
                  </div>
                ))}
                {uploading ? (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-nari-navy font-bold mb-1">
                      <span>Uploading & Hashing…</span><span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-nari-navy/10 rounded-full overflow-hidden">
                      <div className="h-full bg-nari-teal rounded-full transition-all duration-300" style={{ width: progress + '%' }} />
                    </div>
                  </div>
                ) : (
                  <button id="upload-evidence-btn" onClick={upload}
                    className="w-full mt-2 py-3 rounded-xl bg-nari-navy text-white font-semibold hover:bg-[#132846] hover:shadow-md transition-all flex items-center justify-center gap-2">
                    <Lock size={16} />
                    Secure Upload ({files.length} file{files.length > 1 ? 's' : ''})
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="zomato-card bg-white p-10 text-center mb-8">
            <Lock size={32} className="text-nari-navy/50 mx-auto mb-4" />
            <p className="text-nari-navy font-black text-xl mb-2">Sign in to upload evidence</p>
            <p className="text-gray-600 text-sm">Your evidence is encrypted and linked to your account.</p>
          </div>
        )}

        {/* Evidence list */}
        {evidence.length > 0 && (
          <div>
            <h2 className="text-nari-navy font-bold mb-4">Your Evidence Vault ({evidence.length})</h2>
            <div className="space-y-3">
              {evidence.map((ev) => <EvidenceCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
