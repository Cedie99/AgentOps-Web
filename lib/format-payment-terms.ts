/**
 * Formats payment terms from database format to human-readable format
 * @param paymentTerms - The payment terms string from database (e.g., "CREDIT_7", "CREDIT_30", "CASH")
 * @returns Human-readable payment terms (e.g., "Credit 7 Days", "Credit 30 Days", "Cash")
 */
export function formatPaymentTerms(paymentTerms: string): string {
  if (!paymentTerms) return 'Unknown'

  // Handle CASH
  if (paymentTerms.toUpperCase() === 'CASH') {
    return 'Cash'
  }

  // Handle CREDIT_X format
  if (paymentTerms.toUpperCase().startsWith('CREDIT_')) {
    const days = paymentTerms.split('_')[1]
    return `Credit ${days} Days`
  }

  // Handle COD (Cash on Delivery)
  if (paymentTerms.toUpperCase() === 'COD') {
    return 'Cash on Delivery'
  }

  // Fallback: capitalize first letter of each word
  return paymentTerms
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
