import { format } from 'date-fns'

type HistoryItem = {
  id: number
  fileName: string
  originalSize: number
  compressedSize: number
  createdAt: string
}

interface HistorySectionProps {
  items: HistoryItem[]
  isProUser: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function HistorySection({ items, isProUser }: HistorySectionProps) {
  if (!items.length) {
    return null
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">履歴</h2>

      {isProUser ? (
        <div className="space-y-2 border rounded-lg bg-white p-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm text-gray-700"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.fileName}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(item.createdAt), 'yyyy/MM/dd HH:mm')}
                </p>
              </div>
              <div className="ml-4 text-right text-xs text-gray-600">
                <p>
                  {formatFileSize(item.originalSize)} →{' '}
                  <span className="text-blue-600">
                    {formatFileSize(item.compressedSize)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg border bg-gray-50 p-4">
          <div className="pointer-events-none absolute inset-0 bg-white/70 backdrop-blur-sm" />
          <div className="relative space-y-2 text-sm text-gray-400">
            <p>最近圧縮したファイルの履歴がここに表示されます。</p>
            <p>ファイル名やビフォー・アフターのサイズを一覧で確認できます。</p>
          </div>
          <p className="relative mt-3 text-center text-sm font-semibold text-gray-600">
            この履歴機能は <span className="text-purple-600">Pro版のみ</span> で利用できます
          </p>
        </div>
      )}
    </section>
  )
}

