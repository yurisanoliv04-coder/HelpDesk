import { auth } from '@/lib/auth/config'
import { CalendarWidget as CalendarWidgetBase } from '@/components/dashboard/CalendarWidget'

export default async function CalendarWidgetWrapper() {
  const session = await auth()
  const userId = session!.user.id
  return <CalendarWidgetBase userId={userId} />
}
