import { redirect } from 'next/navigation'

export default function HomePage() {
  // This will be handled by middleware or client-side auth check
  // For now, redirect to dashboard
  redirect('/dashboard')
}
