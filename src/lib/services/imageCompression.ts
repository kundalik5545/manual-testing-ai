const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const OUTPUT_QUALITY = 0.75;

function clampDimensions(width: number, height: number) {
  if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
    return { width, height };
  }

  const widthRatio = MAX_WIDTH / width;
  const heightRatio = MAX_HEIGHT / height;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export async function compressImageBlobToDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = clampDimensions(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create image compression context.');
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', OUTPUT_QUALITY);
}
