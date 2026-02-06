/**
 * 動画から指定した位置（パーセンテージ）のフレームを静止画として抽出します
 * @param videoBlob 動画ファイルのBlob
 * @param positionPercent 抽出する位置（0-100、デフォルトは50）
 * @returns フレーム画像のDataURL
 */
export async function extractFrameFromVideo(
  videoBlob: Blob,
  positionPercent: number = 50
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context could not be created'))
      return
    }

    const videoUrl = URL.createObjectURL(videoBlob)
    video.src = videoUrl
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      // 動画の50%の位置にシーク
      const targetTime = (video.duration * positionPercent) / 100
      video.currentTime = targetTime
    }

    video.onseeked = () => {
      try {
        // キャンバスのサイズを動画のサイズに設定
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // フレームをキャンバスに描画
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // キャンバスからDataURLとして取得
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
        
        // メモリをクリーンアップ
        URL.revokeObjectURL(videoUrl)
        video.src = ''
        
        resolve(dataUrl)
      } catch (error) {
        URL.revokeObjectURL(videoUrl)
        video.src = ''
        reject(error)
      }
    }

    video.onerror = (error) => {
      URL.revokeObjectURL(videoUrl)
      video.src = ''
      reject(new Error('Failed to load video: ' + error))
    }

    // 動画の読み込みを開始
    video.load()
  })
}
