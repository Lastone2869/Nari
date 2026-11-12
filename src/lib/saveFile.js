import { Capacitor } from '@capacitor/core';

export const IS_NATIVE = Capacitor.isNativePlatform();

/** Where saveFile puts things, for telling the user. */
export const SAVE_PLACE = IS_NATIVE ? 'Documents/NARI' : 'your downloads';

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** Saves a blob as a file: a browser download on the web, Documents/NARI in the Android app. */
export async function saveFile(blob, filename) {
  if (!IS_NATIVE) {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    setTimeout(() => URL.revokeObjectURL(url), 10000); // let the download start before freeing the blob
    return;
  }
  // An Android WebView cannot download blob URLs, so write through the native filesystem.
  // shortcut: the whole recording is base64-encoded in memory; switch to chunked appends if long videos run out of memory.
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  await Filesystem.writeFile({
    path: `NARI/${filename}`,
    data: await toBase64(blob),
    directory: Directory.Documents,
    recursive: true,
  });
}
