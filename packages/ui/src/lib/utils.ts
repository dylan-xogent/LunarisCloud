import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | bigint, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const bytesNum = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const i = Math.floor(Math.log(bytesNum) / Math.log(k));

  return parseFloat((bytesNum / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('pdf')) return 'file-text';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return 'archive';
  if (mime.includes('text/') || mime.includes('code/')) return 'file-code';
  return 'file';
}

export function truncateFileName(name: string, maxLength = 30) {
  if (name.length <= maxLength) return name;
  
  const extension = name.split('.').pop();
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const maxNameLength = maxLength - (extension ? extension.length + 1 : 0);
  
  return `${nameWithoutExt.substring(0, maxNameLength)}...${extension ? '.' + extension : ''}`;
}
