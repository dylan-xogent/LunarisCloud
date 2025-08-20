'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface UploadButtonProps {
  onFileSelect?: (files: FileList) => void
  multiple?: boolean
  accept?: string
  className?: string
}

export function UploadButton({ 
  onFileSelect, 
  multiple = true, 
  accept,
  className 
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files)
    }
    // Reset the input value so the same file can be selected again
    event.target.value = ''
  }

  return (
    <>
      <Button onClick={handleClick} className={className}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Files
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  )
}
