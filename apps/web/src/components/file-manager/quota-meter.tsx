'use client'

import { formatFileSize } from '@/utils/format'

interface QuotaInfo {
  usedBytes: bigint
  totalBytes: bigint
  usedPercentage: number
  plan: 'FREE' | 'PRO'
}

interface QuotaMeterProps {
  quotaInfo: QuotaInfo
}

export function QuotaMeter({ quotaInfo }: QuotaMeterProps) {
  const { usedBytes, totalBytes, usedPercentage, plan } = quotaInfo

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {formatFileSize(usedBytes)} of {formatFileSize(totalBytes)} used
        </span>
        <span className="text-gray-600">
          {usedPercentage.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(usedPercentage)}`}
          style={{ width: `${Math.min(usedPercentage, 100)}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{plan} Plan</span>
        {usedPercentage >= 90 && (
          <span className="text-red-600 font-medium">
            Storage almost full
          </span>
        )}
      </div>
    </div>
  )
}
