'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Share2, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Lock, 
  Calendar,
  Download,
  Check,
  AlertTriangle
} from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/utils/format'

interface ShareData {
  id: string
  fileId?: string
  folderId?: string
  requiresPassword: boolean
  expiresAt?: string
  maxDownloads?: number
  downloadCount: number
  createdAt: string
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

export default function SharesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: shares, isLoading } = useQuery<ShareData[]>({
    queryKey: ['shares'],
    queryFn: async () => {
      const response = await api.get(endpoints.shares.list)
      return response.data
    },
  })

  const deleteShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      await api.delete(endpoints.shares.delete(shareId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] })
      toast({
        title: 'Share deleted',
        description: 'The share link has been deleted successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete share',
        description: error.response?.data?.message || 'An error occurred while deleting the share.',
        variant: 'destructive',
      })
    },
  })

  const handleCopy = async (shareId: string) => {
    const shareUrl = `${window.location.origin}/s/${shareId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedId(shareId)
      setTimeout(() => setCopiedId(null), 2000)
      toast({
        title: 'Copied to clipboard',
        description: 'Share link has been copied to your clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Failed to copy link to clipboard.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = (shareId: string) => {
    if (confirm('Are you sure you want to delete this share link? This action cannot be undone.')) {
      deleteShareMutation.mutate(shareId)
    }
  }

  const filteredShares = shares?.filter(share => {
    const itemName = share.file?.name || share.folder?.name || ''
    return itemName.toLowerCase().includes(searchTerm.toLowerCase())
  }) || []

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const isDownloadLimitReached = (share: ShareData) => {
    if (!share.maxDownloads) return false
    return share.downloadCount >= share.maxDownloads
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Shares</h1>
            <p className="text-sm text-gray-600">
              Manage your shared files and folders
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading shares...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shares</h1>
          <p className="text-sm text-gray-600">
            Manage your shared files and folders
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search shares..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Shares List */}
      {filteredShares.length > 0 ? (
        <div className="grid gap-4">
          {filteredShares.map((share) => {
            const itemName = share.file?.name || share.folder?.name || 'Unknown'
            const itemType = share.file ? 'file' : 'folder'
            const expired = isExpired(share.expiresAt)
            const downloadLimitReached = isDownloadLimitReached(share)

            return (
              <Card key={share.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      {/* Item Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {itemType === 'file' ? (
                            <span className="text-2xl">📄</span>
                          ) : (
                            <span className="text-2xl">📁</span>
                          )}
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {itemName}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {itemType}
                          {share.file && ` • ${(share.file.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                        
                        {/* Share Info */}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created {formatRelativeTime(share.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Download className="h-4 w-4" />
                            <span>{share.downloadCount} downloads</span>
                            {share.maxDownloads && (
                              <span>/ {share.maxDownloads}</span>
                            )}
                          </div>
                        </div>

                        {/* Share URL */}
                        <div className="mt-3 flex items-center space-x-2">
                          <Input
                            value={`${window.location.origin}/s/${share.id}`}
                            readOnly
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(share.id)}
                          >
                            {copiedId === share.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(`/s/${share.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(share.id)}
                        disabled={deleteShareMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center space-x-2 mt-4">
                    {share.requiresPassword && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Lock className="h-4 w-4" />
                        <span>Password protected</span>
                      </div>
                    )}
                    
                    {share.expiresAt && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {expired ? 'Expired' : `Expires ${formatDate(share.expiresAt)}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Warning Messages */}
                  {(expired || downloadLimitReached) && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div className="text-sm text-yellow-800">
                          {expired && 'This share has expired and is no longer accessible.'}
                          {downloadLimitReached && 'This share has reached its download limit.'}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Share2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No shares yet
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'No shares match your search.' : 'You haven\'t created any share links yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
