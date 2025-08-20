'use client'

import { useQuery } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbsProps {
  currentFolderId: string | null
  onFolderClick: (folderId: string) => void
}

interface FolderData {
  id: string
  name: string
  parentId?: string
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export function Breadcrumbs({ currentFolderId, onFolderClick }: BreadcrumbsProps) {
  const { data: breadcrumbs } = useQuery<FolderData[]>({
    queryKey: ['breadcrumbs', currentFolderId],
    queryFn: async () => {
      if (!currentFolderId) return []
      const response = await api.get(endpoints.folders.breadcrumbs(currentFolderId))
      return response.data
    },
    enabled: !!currentFolderId,
  })

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      <button
        onClick={() => onFolderClick('')}
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Home
      </button>
      
      {breadcrumbs?.map((folder, index) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          <button
            onClick={() => onFolderClick(folder.id)}
            className="hover:text-gray-900 transition-colors truncate max-w-[150px]"
            title={folder.name}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  )
}
