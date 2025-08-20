'use client'

import { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useUpload } from '@/hooks/use-upload'
import { formatFileSize } from '@/utils/format'
import { cn } from '@/utils/cn'

interface UploadZoneProps {
  folderId?: string
  onUploadComplete?: () => void
  className?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const ALLOWED_FILE_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/*',
  'application/zip',
  'application/x-rar-compressed',
]

export function UploadZone({ folderId, onUploadComplete, className }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const { uploadFiles, getAllUploads, clearUploads } = useUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        console.error('Rejected files:', rejectedFiles)
        return
      }

      if (acceptedFiles.length > 0) {
        await uploadFiles(acceptedFiles, { folderId })
        onUploadComplete?.()
      }
    },
    [uploadFiles, folderId, onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      await uploadFiles(files, { folderId })
      onUploadComplete?.()
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploads = getAllUploads()

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragActive || isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
        onDragEnter={() => setIsDragOver(true)}
        onDragLeave={() => setIsDragOver(false)}
      >
        <input {...getInputProps()} />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={ALLOWED_FILE_TYPES.join(',')}
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Upload files'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
        </p>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Uploads</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearUploads}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.fileId}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {upload.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {upload.status === 'uploading' && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  )}
                  {upload.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {upload.progress}%
                    </p>
                  </div>
                  
                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="mt-1" />
                  )}
                  
                  {upload.status === 'error' && (
                    <p className="text-sm text-red-600 mt-1">
                      {upload.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
