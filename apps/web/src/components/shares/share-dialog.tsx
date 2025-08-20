'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, endpoints } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

const shareSchema = z.object({
  requiresPassword: z.boolean().default(false),
  password: z.string().optional(),
  expiresAt: z.date().optional(),
  maxDownloads: z.number().min(1).max(1000).optional(),
})

type ShareForm = z.infer<typeof shareSchema>

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  itemType: 'file' | 'folder'
  itemName: string
}

export function ShareDialog({ open, onOpenChange, itemId, itemType, itemName }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ShareForm>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      requiresPassword: false,
    },
  })

  const requiresPassword = watch('requiresPassword')

  const createShareMutation = useMutation({
    mutationFn: async (data: ShareForm) => {
      const response = await api.post(endpoints.shares.create, {
        fileId: itemType === 'file' ? itemId : undefined,
        folderId: itemType === 'folder' ? itemId : undefined,
        requiresPassword: data.requiresPassword,
        password: data.requiresPassword ? data.password : undefined,
        expiresAt: data.expiresAt?.toISOString(),
        maxDownloads: data.maxDownloads,
      })
      return response.data
    },
    onSuccess: (data) => {
      const shareUrl = `${window.location.origin}/s/${data.id}`
      setShareUrl(shareUrl)
      queryClient.invalidateQueries({ queryKey: ['shares'] })
      toast({
        title: 'Share created',
        description: 'Your share link has been created successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create share',
        description: error.response?.data?.message || 'An error occurred while creating the share.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: ShareForm) => {
    createShareMutation.mutate(data)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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

  const handleClose = () => {
    onOpenChange(false)
    reset()
    setShareUrl('')
    setCopied(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {itemType}</DialogTitle>
          <DialogDescription>
            Create a share link for "{itemName}"
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Password Protection */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password Protection</Label>
                <p className="text-sm text-gray-500">
                  Require a password to access this share
                </p>
              </div>
              <Switch
                checked={requiresPassword}
                onCheckedChange={(checked) => setValue('requiresPassword', checked)}
              />
            </div>

            {requiresPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Enter password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watch('expiresAt') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('expiresAt') ? (
                      format(watch('expiresAt')!, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('expiresAt')}
                    onSelect={(date) => setValue('expiresAt', date)}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Download Limit */}
            <div className="space-y-2">
              <Label htmlFor="maxDownloads">Download Limit (Optional)</Label>
              <Input
                id="maxDownloads"
                type="number"
                min="1"
                max="1000"
                {...register('maxDownloads', { valueAsNumber: true })}
                placeholder="No limit"
                className={errors.maxDownloads ? 'border-red-500' : ''}
              />
              {errors.maxDownloads && (
                <p className="text-sm text-red-500">{errors.maxDownloads.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createShareMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createShareMutation.isPending}>
                {createShareMutation.isPending ? 'Creating...' : 'Create Share'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex items-center space-x-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button type="button" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
