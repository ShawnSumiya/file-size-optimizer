# File Size Optimizer

ブラウザ完結型のファイル圧縮アプリケーション。指定したファイルサイズ（例: 20MB）以内に収まるように、画像や動画を圧縮します。

## 特徴

- **解像度維持**: 4Kなどの高解像度を維持したまま、ビットレートを調整して圧縮
- **目標サイズ指定**: 指定したファイルサイズ以内に収まるように自動調整
- **ブラウザ完結**: サーバーにアップロードする必要がなく、すべての処理がブラウザ内で完結
- **ドラッグ＆ドロップ**: 直感的なUIでファイルを簡単にアップロード

## 技術スタック

- **Framework**: React + Vite (TypeScript)
- **UI**: Tailwind CSS + Lucide React
- **Video Processing**: @ffmpeg/ffmpeg, @ffmpeg/util (WebAssembly, Multi-threading対応)
- **Image Processing**: browser-image-compression
- **Deployment**: Vercel

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
cd ~/Documents/file-size-optimizer
npm install
```

**必要なパッケージ:**
- React 18.2.0
- Vite 5.0.8
- @ffmpeg/ffmpeg 0.12.10 (マルチスレッディング対応)
- @ffmpeg/util 0.12.1
- browser-image-compression 2.0.2
- Tailwind CSS 3.4.0
- Lucide React 0.344.0

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

### ビルド

```bash
npm run build
```

ビルドされたファイルは `dist` ディレクトリに出力されます。

### プレビュー

```bash
npm run preview
```

## 使い方

1. **ファイルを選択**: ドラッグ＆ドロップまたはクリックして画像・動画ファイルを選択
2. **設定を調整**:
   - 目標ファイルサイズ（MB）を指定（デフォルト: 19.5MB）
   - 解像度維持スイッチをON/OFF（デフォルト: ON）
3. **圧縮を開始**: 「圧縮を開始」ボタンをクリック
4. **結果を確認**: 圧縮後のサイズを確認し、ダウンロード

## 圧縮ロジック

### 動画圧縮

- **コーデック**: H.264 (libx264)
- **音声**: AAC 128kbps
- **ビットレート計算**: 目標ファイルサイズから映像ビットレートを逆算
  - 計算式: `(目標サイズ(bit) - 音声ビットレート(bit) × 秒数) / 秒数 = 映像ビットレート`
  - 安全マージンとして計算結果の95%をターゲット

### 画像圧縮

- **ライブラリ**: browser-image-compression
- **WebWorker使用**: UIをブロックしないようにバックグラウンドで処理
- **解像度維持**: 可能な限り元の解像度を維持

## Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 自動的にデプロイされます

### 重要な設定

FFmpeg.wasm (Multi-threading) を動作させるために、以下のセキュリティヘッダーが設定されています：

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

これらの設定は `vite.config.ts` と `vercel.json` に含まれています。

## 対応ファイル形式

- **画像**: JPEG, PNG, WebP, GIF等
- **動画**: MP4, MOV, AVI等（H.264エンコード対応形式）

## 注意事項

- 大きなファイル（特に4K動画）の処理には時間がかかる場合があります
- ブラウザのメモリ制限により、非常に大きなファイルは処理できない場合があります
- 初回のFFmpegロードには時間がかかります（約10-20秒）

## ライセンス

MIT
