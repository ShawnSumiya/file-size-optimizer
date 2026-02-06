import imageCompression from 'browser-image-compression'

export interface CompressImageOptions {
  targetSizeMB: number
  maintainResolution: boolean
  onProgress?: (progress: number) => void
}

export async function compressImage(
  file: File,
  options: CompressImageOptions
): Promise<Blob> {
  const { targetSizeMB, maintainResolution, onProgress } = options

  const compressionOptions: Parameters<typeof imageCompression>[1] = {
    maxSizeMB: targetSizeMB,
    useWebWorker: true,
    onProgress: (progress: number) => {
      // browser-image-compressionのonProgressは0-100のパーセンテージを返す
      onProgress?.(progress)
    },
  }

  // 解像度を維持する場合は、maxWidthOrHeightを非常に大きな値に設定
  if (maintainResolution) {
    Object.assign(compressionOptions, {
      maxWidthOrHeight: 10000, // 実質的に制限なし
    })
  }

  const compressedFile = await imageCompression(file, compressionOptions)
  return compressedFile
}
