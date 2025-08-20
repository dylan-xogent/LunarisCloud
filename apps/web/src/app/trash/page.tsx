'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'

interface TrashItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  deletedAt: string
}

interface TrashData {
  files: TrashItem[]
  folders: TrashItem[]
  total: number
  page: number
  limit: number
}

export default function TrashPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const { data: trashData, isLoading, refetch } = useQuery<TrashData>({
    queryKey: ['trash'],
    queryFn: async () => {
      const response = await api.get(endpoints.files.trash)
      return response.data
    },
  })

  const handleItemSelect = (itemId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedItems)
    if (isSelected) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleRestore = async (itemId: string) => {
    try {
      await api.post(endpoints.files.restore(itemId))
      refetch()
    } catch (error) {
      console.error('Failed to restore item:', error)
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all items in trash? This action cannot be undone.')) {
      return
    }

    try {
      await api.post(endpoints.files.emptyTrash)
      refetch()
      setSelectedItems(new Set())
    } catch (error) {
      console.error('Failed to empty trash:', error)
    }
  }

  const allItems = [...(trashData?.files || []), ...(trashData?.folders || [])]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
          <p className="text-sm text-gray-600">
            Deleted files and folders are kept for 30 days
          </p>
        </div>
        {allItems.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleEmptyTrash}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Empty Trash
          </Button>
        )}
      </div>

      {/* Trash Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Deleted Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : allItems.length > 0 ? (
            <div className="space-y-2">
              {allItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                      className="rounded"
                    />
                    <div className="text-2xl">
                      {item.type === 'folder' ? '📁' : '📄'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Deleted {new Date(item.deletedAt).toLocaleDateString()}
                        {item.size && ` • ${(item.size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(item.id)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <Trash2 className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Trash is empty
              </h3>
              <p className="text-gray-500">
                Deleted files and folders will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Items in trash are automatically deleted after 30 days
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Make sure to restore any important files before they are permanently removed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
