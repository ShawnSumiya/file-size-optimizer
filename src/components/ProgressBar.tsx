import { Progress } from './ui/Progress'

interface ProgressBarProps {
  progress: number
  status: string
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{status}</span>
        <span className="text-gray-500">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} />
    </div>
  )
}
