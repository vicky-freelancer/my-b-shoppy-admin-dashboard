const MAX_IMAGE_DIMENSION = 1600;

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Unable to read this image. Please try another file.'));
    reader.readAsDataURL(blob);
  });
}

/** Resize large photos before embedding them in the product request. */
export async function prepareProductImage(file: File): Promise<string> {
  // Keep animated and vector images intact.
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return readDataUrl(file);
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return readDataUrl(file);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
    return readDataUrl(compressed && compressed.size < file.size ? compressed : file);
  } finally {
    URL.revokeObjectURL(url);
  }
}
