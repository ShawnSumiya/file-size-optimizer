import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let isFFmpegLoaded = false

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && isFFmpegLoaded) {
    return ffmpegInstance
  }

  const ffmpeg = new FFmpeg()
  ffmpegInstance = ffmpeg

  // シングルスレッド版のコアを使用（マルチスレッド版のSharedArrayBufferエラーを回避）
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    // workerURLは指定しない（シングルスレッドのため）
  })

  isFFmpegLoaded = true
  return ffmpeg
}

export interface VideoInfo {
  duration: number // 秒
  width: number
  height: number
}

export async function getVideoInfo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject(new Error('動画情報の取得に失敗しました'))
    }
    
    video.src = URL.createObjectURL(file)
  })
}

export interface CompressVideoOptions {
  targetSizeMB: number
  maintainResolution: boolean
  onProgress?: (progress: number) => void
  onStatus?: (status: string) => void
}

export async function compressVideo(
  file: File,
  options: CompressVideoOptions
): Promise<Blob> {
  const { targetSizeMB, maintainResolution, onProgress, onStatus } = options

  onStatus?.('FFmpegをロード中...')
  const ffmpeg = await loadFFmpeg()

  onStatus?.('動画情報を取得中...')
  const videoInfo = await getVideoInfo(file)

  // 動画情報の検証
  if (!videoInfo.duration || videoInfo.duration <= 0 || !isFinite(videoInfo.duration)) {
    throw new Error('動画の長さを取得できませんでした')
  }

  // ビットレート計算
  // 目標サイズ(bit) = targetSizeMB * 1024 * 1024 * 8
  // 音声ビットレート: 128kbps (固定)
  // 映像ビットレート = (目標サイズ(bit) - 音声ビットレート(bit) * 秒数) / 秒数
  const targetSizeBits = targetSizeMB * 1024 * 1024 * 8
  const audioBitrate = 128 * 1000 // 128kbps in bits per second
  const audioSizeBits = audioBitrate * videoInfo.duration
  const videoSizeBits = targetSizeBits - audioSizeBits
  
  // ビットレート計算（安全マージン95%）
  let calculatedBitrate = (videoSizeBits / videoInfo.duration) * 0.95
  
  // NaN、Infinity、極端に低い値のチェック
  if (!isFinite(calculatedBitrate) || calculatedBitrate <= 0 || isNaN(calculatedBitrate)) {
    console.warn('ビットレート計算が無効な値になりました。デフォルト値を使用します。', {
      calculatedBitrate,
      videoSizeBits,
      duration: videoInfo.duration
    })
    calculatedBitrate = 1000000 // デフォルト: 1000kbps
  }
  
  // 整数に丸めて、最小値を保証
  const targetVideoBitrate = Math.max(
    Math.floor(calculatedBitrate),
    100000 // 最小100kbps
  )

  onStatus?.('ファイルを読み込み中...')
  await ffmpeg.writeFile('input.mp4', await fetchFile(file))

  const outputFileName = 'output.mp4'
  const args: string[] = [
    '-i', 'input.mp4',
    '-c:v', 'libx264',
    '-b:v', `${targetVideoBitrate}`,
    '-preset', 'ultrafast',  // メモリ負荷を下げるため、エンコード速度優先
    '-tune', 'zerolatency',  // ストリーミング向けチューニング（WebAssemblyでの安定性向上）
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ac', '2',              // チャンネル数を固定してオーディオ処理を簡略化
    '-y', // 上書き許可
    outputFileName
  ]

  // 解像度を維持する場合は、スケールを指定しない（元の解像度を維持）
  // maintainResolutionがfalseの場合は、解像度を下げるオプションを追加可能
  if (!maintainResolution) {
    // 解像度を下げる場合の例（必要に応じて調整）
    const maxWidth = 1920
    const maxHeight = 1080
    if (videoInfo.width > maxWidth || videoInfo.height > maxHeight) {
      // outputFileNameの前に挿入する必要があるため、最後の要素を削除してから追加
      args.pop() // outputFileNameを一時的に削除
      args.push('-vf', `scale=${maxWidth}:${maxHeight}:force_original_aspect_ratio=decrease`)
      args.push(outputFileName) // 再度追加
    }
  }

  onStatus?.('エンコード中...')
  
  // FFmpegのログを全てコンソールに出力（エラー原因特定のため）
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg Log]:', message);
  });
  
  ffmpeg.on('progress', ({ progress }) => {
    if (progress !== undefined) {
      onProgress?.(progress * 100)
    }
  })

  // FFmpeg実行と結果の検証
  console.log('[FFmpeg] 実行コマンド:', args.join(' '));
  const exitCode = await ffmpeg.exec(args)
  
  if (exitCode !== 0) {
    console.error('[FFmpeg] エラー発生 - 終了コード:', exitCode);
    // クリーンアップ
    try {
      await ffmpeg.deleteFile('input.mp4')
      await ffmpeg.deleteFile(outputFileName)
    } catch (e) {
      console.error('クリーンアップ中にエラー:', e)
    }
    throw new Error(`動画変換に失敗しました (終了コード: ${exitCode})`)
  }

  onStatus?.('処理完了')
  const data = await ffmpeg.readFile(outputFileName)
  
  // クリーンアップ
  await ffmpeg.deleteFile('input.mp4')
  await ffmpeg.deleteFile(outputFileName)

  return new Blob([data], { type: 'video/mp4' })
}
