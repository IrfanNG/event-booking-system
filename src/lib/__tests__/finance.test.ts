import { describe, it, expect } from 'vitest'
import { resolveBookingFinance, formatMoney } from '../finance'

describe('finance logic', () => {
  describe('resolveBookingFinance', () => {
    it('should correctly resolve full pricing breakdown', () => {
      const source = {
        pricing: {
          currency: 'MYR',
          baseAmount: 1000,
          serviceFeeAmount: 100,
          depositAmount: 200,
          refundAmount: 0,
          totalAmount: 1300
        }
      }
      
      const result = resolveBookingFinance(source)
      
      expect(result.grossAmount).toBe(1100)
      expect(result.netAmount).toBe(1300)
      expect(result.baseAmount).toBe(1000)
    })

    it('should handle missing pricing with totalPrice fallback', () => {
      const source = {
        totalPrice: 500
      }
      
      const result = resolveBookingFinance(source)
      
      expect(result.netAmount).toBe(500)
      expect(result.currency).toBe('MYR')
    })

    it('should infer base amount if missing', () => {
      const source = {
        pricing: {
          serviceFeeAmount: 50,
          totalAmount: 550
        }
      }
      
      const result = resolveBookingFinance(source)
      
      expect(result.baseAmount).toBe(500)
      expect(result.grossAmount).toBe(550)
    })

    it('should round to 2 decimal places', () => {
      const source = {
        totalPrice: 100.333333
      }
      
      const result = resolveBookingFinance(source)
      
      expect(result.netAmount).toBe(100.33)
    })
  })

  describe('formatMoney', () => {
    it('should format MYR with RM prefix', () => {
      expect(formatMoney(1200)).toBe('RM 1,200.00')
    })

    it('should format other currencies with their code', () => {
      expect(formatMoney(100, 'USD')).toBe('USD 100.00')
    })
  })
})
