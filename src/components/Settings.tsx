import { Input } from './ui/Input'
import { Switch } from './ui/Switch'
import { Label } from './ui/Label'

interface SettingsProps {
  targetSizeMB: number
  maintainResolution: boolean
  onTargetSizeChange: (size: number) => void
  onMaintainResolutionChange: (maintain: boolean) => void
  disabled?: boolean
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
