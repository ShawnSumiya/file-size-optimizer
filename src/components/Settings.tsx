import { Input } from './ui/Input'
import { Switch } from './ui/Switch'
import { Label } from './ui/Label'

type Preset = { name: string; limit: number; safeValue: number }
type PresetGroup = { label: string; items: Preset[] }

interface SettingsProps {
  targetSizeMB: number
  maintainResolution: boolean
  onTargetSizeChange: (size: number) => void
  onMaintainResolutionChange: (maintain: boolean) => void
  disabled?: boolean
  presetGroups: PresetGroup[]
  selectedPresetName: string | null
  onPresetChange: (preset: Preset) => void
  isProUser: boolean
}

export function Settings({
  targetSizeMB,
  maintainResolution,
  onTargetSizeChange,
  onMaintainResolutionChange,
  disabled,
  presetGroups,
  selectedPresetName,
  onPresetChange,
  isProUser,
}: SettingsProps) {
  const allPresets = presetGroups.flatMap((group) => group.items)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="preset">アップロード先サービス（クイックプリセット）</Label>
        <select
          id="preset"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={selectedPresetName ?? ''}
          onChange={(e) => {
            const preset = allPresets.find((p) => p.name === e.target.value)
            if (preset) {
              onPresetChange(preset)
            }
          }}
          disabled={disabled}
        >
          <option value="">カスタム（手動でサイズを指定）</option>
          {presetGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}（上限 {preset.limit}MB / 安全値 {preset.safeValue}MB）
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          サービスを選ぶと、そのサービスに安全にアップロードできる目標ファイルサイズが自動で入力されます。
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="target-size">目標ファイルサイズ (MB)</Label>
          {!isProUser && (
            <button
              type="button"
              className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
              onClick={() => {
                alert('カスタムサイズ指定はPro版限定機能です')
              }}
            >
              <span className="mr-1">🔒</span>
              Pro
            </button>
          )}
        </div>
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
          disabled={disabled || !isProUser}
          className="mt-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
