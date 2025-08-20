'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { FileItem } from './file-item'
import { FolderItem } from './folder-item'
import { Breadcrumbs } from './breadcrumbs'
import { EmptyState } from './empty-state'
import { LoadingSpinner } from './loading-spinner'

interface FileManagerProps {
  currentFolderId: string | null
  onFolderChange: (folderId: string | null) => void
}

interface FileData {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  s3Key: string
  folderId?: string
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  uploadId?: string
  uploadStatus: 'pending' | 'completed' | 'failed'
}

interface FolderData {
  id: string
  name: string
  parentId?: string
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  _count?: {
    children: number
    files: number
  }
}

interface FolderContents {
  folders: FolderData[]
  files: FileData[]
  total: number
  page: number
  limit: number
}

export function FileManager({ currentFolderId, onFolderChange }: FileManagerProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch folder contents
  const { data: folderContents, isLoading, error } = useQuery<FolderContents>({
    queryKey: ['folder-contents', currentFolderId],
    queryFn: async () => {
      if (currentFolderId) {
        const response = await api.get(endpoints.folders.children(currentFolderId))
        return response.data
      } else {
        const response = await api.get(endpoints.files.list)
        return {
          folders: [],
          files: response.data.files || [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 20,
        }
      }
    },
    enabled: true,
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

  const handleFolderClick = (folderId: string) => {
    onFolderChange(folderId)
    setSelectedItems(new Set()) // Clear selection when navigating
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load files and folders</p>
      </div>
    )
  }

  const hasItems = folderContents && (folderContents.folders.length > 0 || folderContents.files.length > 0)

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        currentFolderId={currentFolderId} 
        onFolderClick={handleFolderClick}
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            List
          </button>
        </div>
        
        {selectedItems.size > 0 && (
          <div className="text-sm text-gray-600">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Files and Folders */}
      {hasItems ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
          {/* Folders */}
          {folderContents?.folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              viewMode={viewMode}
              isSelected={selectedItems.has(folder.id)}
              onSelect={(isSelected) => handleItemSelect(folder.id, isSelected)}
              onClick={() => handleFolderClick(folder.id)}
            />
          ))}
          
          {/* Files */}
          {folderContents?.files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              isSelected={selectedItems.has(file.id)}
              onSelect={(isSelected) => handleItemSelect(file.id, isSelected)}
            />
          ))}
        </div>
      ) : (
        <EmptyState currentFolderId={currentFolderId} />
      )}
    </div>
  )
}
