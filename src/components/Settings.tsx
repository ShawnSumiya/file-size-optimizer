import { Input } from './ui/Input'
import { Switch } from './ui/Switch'
import { Label } from './ui/Label'

interface SettingsProps {
  targetSizeMB: number
  maintainResolution: boolean
  onTargetSizeChange: (size: number) => void
  onMaintainResolutionChange: (maintain: boolean) => void
  disabled?: boolean
  presets?: {
    name: string
    limit: number
    safeValue: number
  }[]
  selectedPresetName?: string
  onPresetChange?: (name: string) => void
}

export function Settings({
  targetSizeMB,
  maintainResolution,
  onTargetSizeChange,
  onMaintainResolutionChange,
  disabled,
}: SettingsProps) {
  return (
    <div className="space-y-4">
      {presets && onPresetChange && (
        <div>
          <Label htmlFor="preset">アップロード先サービス（クイックプリセット）</Label>
          <select
            id="preset"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedPresetName ?? ''}
            onChange={(e) => onPresetChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">カスタム（手動でサイズを指定）</option>
            {presets.map((preset) => (
              <option key={preset.name} value={preset.name}>
                {preset.name}（上限 {preset.limit}MB / 安全値 {preset.safeValue}MB）
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            サービスを選ぶと、そのサービスに安全にアップロードできる目標ファイルサイズが自動で入力されます。
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="target-size">目標ファイルサイズ (MB)</Label>
        <Input
          id="target-size"
          type="number"
          min="0.1"
          max="100"
          step="0.1"
          value={targetSizeMB}
          onChange={(e) => {
            const value = parseFloat(e.target.value)
            if (!isNaN(value) && value > 0) {
              onTargetSizeChange(value)
            }
          }}
          disabled={disabled}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          デフォルト: 19.5MB (Etsy等の20MB制限を考慮)
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label htmlFor="maintain-resolution">解像度を維持</Label>
          <p className="text-xs text-gray-500 mt-1">
            解像度を維持したまま、ビットレートを調整して圧縮します
          </p>
        </div>
        <Switch
          id="maintain-resolution"
          checked={maintainResolution}
          onChange={(e) => onMaintainResolutionChange(e.target.checked)}
          disabled={disabled}
          className="ml-4"
        />
      </div>
    </div>
  )
}
