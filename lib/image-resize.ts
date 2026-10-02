/** Reduce una imagen en el navegador (WEBP) antes de subirla. SVG se sube tal cual. */
export async function prepareImage(file: File, maxDimension: number): Promise<File> {
  if (file.type === "image/svg+xml") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob || blob.type !== "image/webp") throw new Error("No se pudo procesar la imagen");
  return new File([blob], "image.webp", { type: "image/webp" });
}
