import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { Button } from './ui/Button'
import { extractFrameFromVideo } from '../utils/videoFrameExtraction'

interface ResultProps {
  originalSize: number
  compressedSize: number
  compressedBlob: Blob
  fileName: string
  originalFile?: File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function Result({
  originalSize,
  compressedSize,
  compressedBlob,
  fileName,
  originalFile,
}: ResultProps) {
  const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1)
  const originalFormatted = formatFileSize(originalSize)
  const compressedFormatted = formatFileSize(compressedSize)
  const isVideo = originalFile?.type.startsWith('video/') || compressedBlob.type.startsWith('video/')
  
  const [originalFrame, setOriginalFrame] = useState<string | null>(null)
  const [compressedFrame, setCompressedFrame] = useState<string | null>(null)
  const [isLoadingFrames, setIsLoadingFrames] = useState(false)

  useEffect(() => {
    if (isVideo && originalFile) {
      setIsLoadingFrames(true)
      Promise.all([
        extractFrameFromVideo(originalFile, 50),
        extractFrameFromVideo(compressedBlob, 50),
      ])
        .then(([original, compressed]) => {
          setOriginalFrame(original)
          setCompressedFrame(compressed)
        })
        .catch((error) => {
          console.error('フレーム抽出エラー:', error)
        })
        .finally(() => {
          setIsLoadingFrames(false)
        })
    }
  }, [isVideo, originalFile, compressedBlob])

  const handleDownload = () => {
    const url = URL.createObjectURL(compressedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${fileName}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">圧縮結果</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">元のサイズ</p>
          <p className="text-lg font-medium">{originalFormatted}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">圧縮後のサイズ</p>
          <p className="text-lg font-medium text-blue-600">{compressedFormatted}</p>
        </div>
      </div>

      {isVideo && originalFile && (
        <div className="pt-4 border-t">
          <h4 className="text-md font-semibold mb-3">画質比較（中間フレーム）</h4>
          {isLoadingFrames ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">フレームを抽出中...</p>
            </div>
          ) : originalFrame && compressedFrame ? (
            <div className="rounded-lg overflow-hidden border">
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={originalFrame} alt="元の動画" />}
                itemTwo={<ReactCompareSliderImage src={compressedFrame} alt="圧縮後の動画" />}
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-500 text-sm">フレームの抽出に失敗しました</p>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-600 mb-2">
          サイズ削減: <span className="font-semibold text-green-600">{reduction}%</span>
        </p>
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          ダウンロード
        </Button>
      </div>
    </div>
  )
}
