'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface UploadOptions {
  folderId?: string
  onProgress?: (progress: UploadProgress) => void
}

export function useUpload() {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const initiateUploadMutation = useMutation({
    mutationFn: async ({ file, folderId }: { file: File; folderId?: string }) => {
      const response = await api.post(endpoints.files.upload.initiate, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        folderId,
      })
      return response.data
    },
  })

  const completeUploadMutation = useMutation({
    mutationFn: async ({ fileId, uploadId }: { fileId: string; uploadId: string }) => {
      const response = await api.post(endpoints.files.upload.complete, {
        fileId,
        uploadId,
      })
      return response.data
    },
  })

  const uploadFile = useCallback(
    async (file: File, options: UploadOptions = {}) => {
      const fileId = crypto.randomUUID()
      const uploadProgress: UploadProgress = {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }

      setUploads(prev => new Map(prev).set(fileId, uploadProgress))

      try {
        // Step 1: Initiate upload
        uploadProgress.status = 'uploading'
        setUploads(prev => new Map(prev).set(fileId, { ...uploadProgress }))

        const initiateResponse = await initiateUploadMutation.mutateAsync({
          file,
          folderId: options.folderId,
        })

        const { uploadId, presignedUrls, parts } = initiateResponse

        // Step 2: Upload parts
        const uploadedParts = []
        const partSize = 5 * 1024 * 1024 // 5MB parts
        let uploadedBytes = 0

        for (let i = 0; i < parts.length; i++) {
          const start = i * partSize
          const end = Math.min(start + partSize, file.size)
          const chunk = file.slice(start, end)

          try {
            const response = await fetch(presignedUrls[i], {
              method: 'PUT',
              body: chunk,
              headers: {
                'Content-Type': file.type,
              },
            })

            if (!response.ok) {
              throw new Error(`Failed to upload part ${i + 1}`)
            }

            const etag = response.headers.get('ETag')?.replace(/"/g, '')
            if (etag) {
              uploadedParts.push({
                ETag: etag,
                PartNumber: i + 1,
              })
            }

            uploadedBytes += chunk.size
            const progress = Math.round((uploadedBytes / file.size) * 100)

            uploadProgress.progress = progress
            setUploads(prev => new Map(prev).set(fileId, { ...uploadProgress }))
            options.onProgress?.(uploadProgress)

          } catch (error) {
            uploadProgress.status = 'error'
            uploadProgress.error = `Failed to upload part ${i + 1}`
            setUploads(prev => new Map(prev).set(fileId, { ...uploadProgress }))
            throw error
          }
        }

        // Step 3: Complete upload
        await completeUploadMutation.mutateAsync({
          fileId: initiateResponse.fileId,
          uploadId,
        })

        uploadProgress.status = 'completed'
        uploadProgress.progress = 100
        setUploads(prev => new Map(prev).set(fileId, { ...uploadProgress }))
        options.onProgress?.(uploadProgress)

        // Invalidate queries to refresh file list
        queryClient.invalidateQueries({ queryKey: ['folder-contents'] })
        queryClient.invalidateQueries({ queryKey: ['user-quota'] })

        toast({
          title: 'Upload completed',
          description: `${file.name} has been uploaded successfully.`,
        })

        return initiateResponse.fileId

      } catch (error: any) {
        uploadProgress.status = 'error'
        uploadProgress.error = error.message || 'Upload failed'
        setUploads(prev => new Map(prev).set(fileId, { ...uploadProgress }))

        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}: ${uploadProgress.error}`,
          variant: 'destructive',
        })

        throw error
      }
    },
    [initiateUploadMutation, completeUploadMutation, queryClient, toast]
  )

  const uploadFiles = useCallback(
    async (files: FileList | File[], options: UploadOptions = {}) => {
      const fileArray = Array.from(files)
      const uploadPromises = fileArray.map(file => uploadFile(file, options))
      
      try {
        await Promise.all(uploadPromises)
      } catch (error) {
        // Individual file errors are handled in uploadFile
        console.error('Some uploads failed:', error)
      }
    },
    [uploadFile]
  )

  const clearUploads = useCallback(() => {
    setUploads(new Map())
  }, [])

  const getUploadProgress = useCallback((fileId: string) => {
    return uploads.get(fileId)
  }, [uploads])

  const getAllUploads = useCallback(() => {
    return Array.from(uploads.values())
  }, [uploads])

  return {
    uploadFile,
    uploadFiles,
    clearUploads,
    getUploadProgress,
    getAllUploads,
    isUploading: initiateUploadMutation.isPending || completeUploadMutation.isPending,
  }
}
