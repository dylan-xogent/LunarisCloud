'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { FileManager } from '@/components/file-manager/file-manager'
import { QuotaMeter } from '@/components/file-manager/quota-meter'
import { UploadButton } from '@/components/upload/upload-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Folder } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name?: string
  plan: 'FREE' | 'PRO'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface QuotaInfo {
  usedBytes: bigint
  totalBytes: bigint
  usedPercentage: number
  plan: 'FREE' | 'PRO'
}

export default function DashboardPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  // Fetch user profile
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get(endpoints.user.profile)
      return response.data
    },
  })

  // Fetch quota information
  const { data: quotaInfo } = useQuery<QuotaInfo>({
    queryKey: ['user-quota'],
    queryFn: async () => {
      const response = await api.get(endpoints.user.quota)
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
          <p className="text-sm text-gray-600">
            Welcome back, {userProfile?.name || userProfile?.email}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Folder className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <UploadButton />
        </div>
      </div>

      {/* Quota Meter */}
      {quotaInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <QuotaMeter quotaInfo={quotaInfo} />
          </CardContent>
        </Card>
      )}

      {/* File Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Files & Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <FileManager 
            currentFolderId={currentFolderId}
            onFolderChange={setCurrentFolderId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
