'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Lock, File, Folder, AlertTriangle } from 'lucide-react'
import { formatFileSize, formatDate, getFileIcon } from '@/utils/format'

interface ShareData {
  id: string
  fileId?: string
  folderId?: string
  requiresPassword: boolean
  expiresAt?: string
  maxDownloads?: number
  downloadCount: number
  file?: {
    id: string
    name: string
    size: number
    mimeType: string
  }
  folder?: {
    id: string
    name: string
  }
}

export default function PublicSharePage() {
  const params = useParams()
  const shareId = params.id as string
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')

  const { data: shareData, isLoading, error: shareError } = useQuery<ShareData>({
    queryKey: ['public-share', shareId],
    queryFn: async () => {
      const response = await api.get(endpoints.shares.public(shareId))
      return response.data
    },
    enabled: !!shareId,
  })

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post(endpoints.shares.validatePassword(shareId), {
        password,
      })
      
      if (response.data) {
        setIsAuthenticated(true)
      } else {
        setError('Incorrect password')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate password')
    }
  }

  const handleDownload = async () => {
    try {
      // Increment download count
      await api.post(endpoints.shares.download(shareId))
      
      // Get download URL
      if (shareData?.fileId) {
        const response = await api.get(endpoints.files.download(shareData.fileId))
        const downloadUrl = response.data.downloadUrl
        
        // Create temporary link and trigger download
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = shareData.file?.name || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download file')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (shareError || !shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Share not found
              </h2>
              <p className="text-gray-600">
                This share link may have expired or been removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if share has expired
  if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Share has expired
              </h2>
              <p className="text-gray-600">
                This share link has expired and is no longer available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if download limit reached
  if (shareData.maxDownloads && shareData.downloadCount >= shareData.maxDownloads) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Download limit reached
              </h2>
              <p className="text-gray-600">
                This share has reached its maximum download limit.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password protection
  if (shareData.requiresPassword && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Lock className="h-6 w-6 mr-2" />
              Password Protected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the share password"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                Access Share
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Shared Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File/Folder Info */}
          <div className="text-center">
            <div className="text-4xl mb-3">
              {shareData.file ? getFileIcon(shareData.file.mimeType) : '📁'}
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {shareData.file?.name || shareData.folder?.name}
            </h3>
            {shareData.file && (
              <p className="text-sm text-gray-500">
                {formatFileSize(shareData.file.size)}
              </p>
            )}
          </div>

          {/* Download Stats */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">
              <p>Downloads: {shareData.downloadCount}</p>
              {shareData.maxDownloads && (
                <p>Limit: {shareData.maxDownloads}</p>
              )}
              {shareData.expiresAt && (
                <p>Expires: {formatDate(shareData.expiresAt)}</p>
              )}
            </div>
          </div>

          {/* Download Button */}
          {shareData.file && (
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download File
            </Button>
          )}

          {shareData.folder && (
            <div className="text-center text-sm text-gray-500">
              <p>This is a shared folder. Please contact the owner for access.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
