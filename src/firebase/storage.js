// src/firebase/storage.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/** SHA-256 hash of a file (browser crypto) */
export const hashFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/** Upload a file to Firebase Storage and return { url, hash, path } */
export const uploadEvidence = async (file, userId, reportId = 'general') => {
  const hash = await hashFile(file);
  const ext = file.name.split('.').pop();
  const path = `evidence/${userId}/${reportId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { customMetadata: { sha256: hash } });
  const url = await getDownloadURL(storageRef);
  return { url, hash, path, name: file.name, size: file.size, type: file.type };
};
