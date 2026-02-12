import { useEffect, useState } from 'react'
import { FileInput } from './components/FileInput'
import { Settings } from './components/Settings'
import { ProgressBar } from './components/ProgressBar'
import { Result } from './components/Result'
import { HistorySection } from './components/HistorySection'
import { compressVideo } from './utils/videoCompression'
import { compressImage } from './utils/imageCompression'

type ProcessingState = 'idle' | 'processing' | 'completed' | 'error'

type Preset = {
  name: string
  limit: number
  safeValue: number
}

type PresetGroup = {
  label: string
  items: Preset[]
}

type HistoryItem = {
  id: number
  fileName: string
  originalSize: number
  compressedSize: number
  createdAt: string
}

const PRESET_GROUPS: PresetGroup[] = [
  {
    label: 'ハンドメイド・販売',
    items: [
      { name: 'Etsy', limit: 20, safeValue: 19.5 },
      {
        name: 'BOOTH',
        limit: 1000,
        safeValue: 500, // BOOTH上限は10GBだがブラウザ処理とDLのしやすさを考慮し500MB推奨
      },
    ],
  },
  {
    label: 'SNS',
    items: [
      { name: 'X (Twitter)', limit: 512, safeValue: 500 }, // Web/Pro上限
      {
        name: 'Instagram',
        limit: 4000,
        safeValue: 1000, // リール上限は4GBだがブラウザ処理限界を考慮し1GB
      },
      {
        name: 'TikTok',
        limit: 72,
        safeValue: 70, // Android版の制限(72MB)に合わせるのが最も安全
      },
    ],
  },
  {
    label: 'メッセンジャー・その他',
    items: [
      { name: 'Discord (Free)', limit: 8, safeValue: 7.8 },
      { name: 'Discord (Nitro)', limit: 50, safeValue: 49.5 },
      { name: 'Gmail', limit: 25, safeValue: 24.5 },
    ],
  },
]

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [targetSizeMB, setTargetSizeMB] = useState(19.5)
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null)
  const [maintainResolution, setMaintainResolution] = useState(true)
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProUser, setIsProUser] = useState(false)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('isProUser')
      let isPro = stored === 'true'

      const url = new URL(window.location.href)
      const authToken = url.searchParams.get('auth')

      if (authToken === 'v-studio-access-2025') {
        isPro = true
        window.localStorage.setItem('isProUser', 'true')
      }

      if (url.searchParams.has('auth')) {
        url.searchParams.delete('auth')
        const newUrl = url.pathname + url.search + url.hash
        window.history.replaceState(null, '', newUrl)
      }

      if (isPro) {
        setIsProUser(true)
      }
    } catch (err) {
      console.error('Pro版認証の初期化に失敗しました:', err)
    }
  }, [])

  const handleTargetSizeChange = (size: number) => {
    setTargetSizeMB(size)
    // 手動入力が行われた場合はプリセット選択をリセット
    setSelectedPresetName(null)
  }

  const handlePresetChange = (preset: Preset) => {
    setSelectedPresetName(preset.name)
    setTargetSizeMB(preset.safeValue)
  }

  const handleFileSelect = (selectedFile: File) => {
    if (!isVideoFile(selectedFile) && !isImageFile(selectedFile)) {
      setError('対応していないファイル形式です。画像または動画ファイルを選択してください。')
      return
    }

    setFile(selectedFile)
    setProcessingState('idle')
    setCompressedBlob(null)
    setError(null)
    setProgress(0)
    setStatus('')
  }

  const handleCompress = async () => {
    if (!file) return

    setProcessingState('processing')
    setProgress(0)
    setError(null)
    setCompressedBlob(null)

    try {
      let blob: Blob

      if (isVideoFile(file)) {
        setStatus('動画を圧縮中...')
        blob = await compressVideo(file, {
          targetSizeMB,
          maintainResolution,
          onProgress: (prog) => setProgress(prog),
          onStatus: (stat) => setStatus(stat),
        })
      } else if (isImageFile(file)) {
        setStatus('画像を圧縮中...')
        blob = await compressImage(file, {
          targetSizeMB,
          maintainResolution,
          onProgress: (prog) => setProgress(prog),
        })
      } else {
        throw new Error('対応していないファイル形式です')
      }

      setCompressedBlob(blob)
      setProcessingState('completed')
      setStatus('完了')
      setProgress(100)

      setHistoryItems((prev) => {
        const newItem: HistoryItem = {
          id: Date.now(),
          fileName: file.name,
          originalSize: file.size,
          compressedSize: blob.size,
          createdAt: new Date().toISOString(),
        }
        return [newItem, ...prev].slice(0, 10)
      })
    } catch (err) {
      console.error('圧縮エラー:', err)
      setError(err instanceof Error ? err.message : '圧縮中にエラーが発生しました')
      setProcessingState('error')
      setStatus('エラー')
    }
  }

  const handleReset = () => {
    setFile(null)
    setProcessingState('idle')
    setCompressedBlob(null)
    setError(null)
    setProgress(0)
    setStatus('')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold text-gray-900">
              File Size Optimizer
            </h1>
            {isProUser && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                Pro Plan
              </span>
            )}
          </div>
          <p className="mt-3 text-gray-600">
            画像や動画を指定したファイルサイズ以内に圧縮します
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {!file ? (
            <>
              <FileInput
                onFileSelect={handleFileSelect}
                accept="image/*,video/*"
              />
              <Settings
                targetSizeMB={targetSizeMB}
                presetGroups={PRESET_GROUPS}
                selectedPresetName={selectedPresetName}
                onPresetChange={handlePresetChange}
                maintainResolution={maintainResolution}
                onTargetSizeChange={handleTargetSizeChange}
                onMaintainResolutionChange={setMaintainResolution}
                isProUser={isProUser}
              />
            </>
          ) : (
            <>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    変更
                  </button>
                </div>
              </div>

              {processingState === 'idle' && (
                <>
                  <Settings
                    targetSizeMB={targetSizeMB}
                    presetGroups={PRESET_GROUPS}
                    selectedPresetName={selectedPresetName}
                    onPresetChange={handlePresetChange}
                    maintainResolution={maintainResolution}
                    onTargetSizeChange={handleTargetSizeChange}
                    onMaintainResolutionChange={setMaintainResolution}
                    isProUser={isProUser}
                  />
                  <button
                    onClick={handleCompress}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    圧縮を開始
                  </button>
                </>
              )}

              {processingState === 'processing' && (
                <ProgressBar progress={progress} status={status} />
              )}

              {processingState === 'completed' && compressedBlob && (
                <>
                  <Result
                    originalSize={file.size}
                    compressedSize={compressedBlob.size}
                    compressedBlob={compressedBlob}
                    fileName={file.name}
                    originalFile={file}
                  />
                  <button
                    onClick={handleReset}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    新しいファイルを選択
                  </button>
                </>
              )}

              {processingState === 'error' && error && (
                <div className="border border-red-300 rounded-lg p-4 bg-red-50">
                  <p className="text-red-800 font-medium mb-2">エラーが発生しました</p>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-4 w-full border border-red-300 text-red-700 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                  >
                    やり直す
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <HistorySection items={historyItems} isProUser={isProUser} />

        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>対応形式: 画像 (JPEG, PNG, WebP等) / 動画 (MP4, MOV等)</p>
        </footer>
      </div>
    </div>
  )
}

export default App
