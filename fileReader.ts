export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '420 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function processImageFileToDataUrl(
  file: File,
  maxWidth = 480,
  maxHeight = 600,
  quality = 0.86
): Promise<{ dataUrl: string; sizeFormatted: string; filename: string }> {
  const sizeFormatted = formatFileSize(file.size);
  const filename = file.name || 'Fotografia_Passe_Candidato.jpg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler ficheiro de imagem.'));
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        reject(new Error('Ficheiro de imagem vazio.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to raw data URL if canvas decoding is not supported for this format
        resolve({ dataUrl: rawDataUrl, sizeFormatted, filename });
      };
      img.onload = () => {
        try {
          let targetW = img.width || maxWidth;
          let targetH = img.height || maxHeight;

          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH, 1);
          targetW = Math.max(1, Math.round(targetW * ratio));
          targetH = Math.max(1, Math.round(targetH * ratio));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: rawDataUrl, sizeFormatted, filename });
            return;
          }

          // White background for institutional passport photos
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            dataUrl: compressedDataUrl || rawDataUrl,
            sizeFormatted,
            filename,
          });
        } catch {
          resolve({ dataUrl: rawDataUrl, sizeFormatted, filename });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function processDocumentFile(file: File): Promise<{
  filename: string;
  sizeFormatted: string;
  dataUrl: string;
  type: 'pdf' | 'image';
}> {
  const filename = file.name;
  const sizeFormatted = formatFileSize(file.size);
  const isImage =
    file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);

  if (isImage) {
    const res = await processImageFileToDataUrl(file, 900, 1200, 0.84);
    return {
      filename: res.filename,
      sizeFormatted: res.sizeFormatted,
      dataUrl: res.dataUrl,
      type: 'image',
    };
  }

  // For small PDFs (<= 350 KB), store base64 data URL directly; otherwise store structured metadata URI
  if (file.size <= 350 * 1024) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
    if (dataUrl) {
      return {
        filename,
        sizeFormatted,
        dataUrl,
        type: 'pdf',
      };
    }
  }

  return {
    filename,
    sizeFormatted,
    dataUrl: `storage://itpgq-supabase/${Date.now()}_${encodeURIComponent(filename)}`,
    type: 'pdf',
  };
}

export function generateNextCandidateId(existingCandidates: { id: string }[]): string {
  const existingIds = new Set(existingCandidates.map((c) => c.id.toUpperCase()));
  let maxNum = 0;

  for (const c of existingCandidates) {
    const match = c.id.match(/CAN-\d{4}-(\d+)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed < 900000 && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidateId = `CAN-2026-${String(nextNum).padStart(6, '0')}`;
  while (existingIds.has(candidateId.toUpperCase())) {
    nextNum += 1;
    candidateId = `CAN-2026-${String(nextNum).padStart(6, '0')}`;
  }

  return candidateId;
}
