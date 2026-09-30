import { Platform } from 'react-native';

/**
 * Converte URI local/blob em arquivo pronto para o Storage.
 * No web (PWA celular), normaliza para JPEG via canvas para o desktop
 * conseguir abrir a mesma imagem depois.
 */
export async function uriParaBlobJpeg(uri) {
  const resposta = await fetch(uri);
  const blobOriginal = await resposta.blob();

  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return { blob: blobOriginal, contentType: blobOriginal.type || 'image/jpeg' };
  }

  try {
    const bitmap = await createImageBitmap(blobOriginal);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const jpegBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (jpegBlob && jpegBlob.size > 0) {
      return { blob: jpegBlob, contentType: 'image/jpeg' };
    }
  } catch (err) {
    console.log('Falha ao converter foto para JPEG; enviando original.', err);
  }

  return { blob: blobOriginal, contentType: blobOriginal.type || 'image/jpeg' };
}

export function extensaoDeContentType(contentType) {
  if ((contentType || '').includes('png')) return 'png';
  if ((contentType || '').includes('webp')) return 'webp';
  return 'jpg';
}
