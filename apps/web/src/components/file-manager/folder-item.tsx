'use client'

import { useState } from 'react'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { Folder, MoreVertical, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

interface FolderItemProps {
  folder: FolderData
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (isSelected: boolean) => void
  onClick: () => void
}

export function FolderItem({ folder, viewMode, isSelected, onSelect, onClick }: FolderItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick()
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share folder:', folder.id)
  }

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete folder:', folder.id)
  }

  if (viewMode === 'grid') {
    return (
      <div
        className={cn(
          "relative group cursor-pointer rounded-lg border p-4 hover:bg-gray-50 transition-colors",
          isSelected && "bg-blue-50 border-blue-200"
        )}
        onClick={handleClick}
      >
        {/* Selection checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 z-10"
        />

        {/* Folder icon */}
        <div className="flex justify-center mb-3">
          <div className="text-4xl">📁</div>
        </div>

        {/* Folder name */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 truncate" title={folder.name}>
            {folder.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {folder._count?.files || 0} files
            {folder._count?.children ? `, ${folder._count.children} folders` : ''}
          </p>
        </div>

        {/* Action menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute top-8 right-2 bg-white border rounded-md shadow-lg z-20 min-w-[120px]">
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
              onClick={(e) => {
                e.stopPropagation()
                handleShare()
                setShowMenu(false)
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
                setShowMenu(false)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  // List view
  return (
    <div
      className={cn(
        "flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
        isSelected && "bg-blue-50 border border-blue-200"
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        className="mr-3"
      />

      {/* Folder icon */}
      <div className="text-2xl mr-3">📁</div>

      {/* Folder details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate" title={folder.name}>
          {folder.name}
        </p>
        <p className="text-xs text-gray-500">
          {folder._count?.files || 0} files
          {folder._count?.children ? `, ${folder._count.children} folders` : ''}
          {' • '}{formatDate(folder.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            handleShare()
          }}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
