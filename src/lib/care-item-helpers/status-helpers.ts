/**
 * Helper to align status
 */

export function occurrenceStatus(
  nextDue?: string
): 'Overdue' | 'Due' | 'Pending' {
  if (!nextDue) return 'Pending';
  const today = new Date().toISOString().slice(0, 10);
  if (nextDue < today) return 'Overdue';
  if (nextDue === today) return 'Due';
  return 'Pending';
}

// Colors for those labels
export function getStatusColor(status: string) {
  switch ((status || '').toLowerCase()) {
    case 'overdue':
      return 'bg-red-500 text-white';
    case 'due':
      return 'bg-red-500/80 text-white';
    case 'not completed':
      return 'bg-orange-400 text-white';
    case 'completed':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-300 text-black';
  }
}
