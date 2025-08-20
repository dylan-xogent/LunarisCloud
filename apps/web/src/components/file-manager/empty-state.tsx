'use client'

import { Upload, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  currentFolderId: string | null
}

export function EmptyState({ currentFolderId }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {currentFolderId ? <Folder className="h-12 w-12" /> : <Upload className="h-12 w-12" />}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {currentFolderId ? 'This folder is empty' : 'No files yet'}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {currentFolderId 
          ? 'Upload files to this folder or create subfolders to get started.'
          : 'Upload your first file to get started with LunarisCloud.'
        }
      </p>
      
      <div className="flex items-center justify-center space-x-3">
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
        <Button variant="outline">
          <Folder className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>
    </div>
  )
}
