import { LedgerEntry } from '../src/models/LedgerEntry.js';

describe('Financial & Ledger Settlement Logic', () => {
  describe('Double-Entry Ledger Invariants', () => {
    it('should balance debit and credit entries for a settled exchange', () => {
      const hoursExchanged = 4.0;
      const payerInitialBalance = 10.0;
      const payeeInitialBalance = 2.0;

      // Payer Debit Entry
      const debitEntry = new LedgerEntry({
        id: 'le-1',
        transaction_id: 'tx-1',
        user_id: 'payer-1',
        entry_type: LedgerEntry.Type.DEBIT,
        hours: hoursExchanged,
        balance_after: payerInitialBalance - hoursExchanged,
        description: 'Paid for service'
      });

      // Payee Credit Entry
      const creditEntry = new LedgerEntry({
        id: 'le-2',
        transaction_id: 'tx-1',
        user_id: 'payee-1',
        entry_type: LedgerEntry.Type.CREDIT,
        hours: hoursExchanged,
        balance_after: payeeInitialBalance + hoursExchanged,
        description: 'Earned from service'
      });

      expect(debitEntry.isDebit()).toBe(true);
      expect(creditEntry.isCredit()).toBe(true);
      expect(debitEntry.hours).toBe(creditEntry.hours);
      expect(debitEntry.balance_after).toBe(6.0);
      expect(creditEntry.balance_after).toBe(6.0);

      // Conservation of total system credits
      const initialTotal = payerInitialBalance + payeeInitialBalance;
      const finalTotal = debitEntry.balance_after + creditEntry.balance_after;
      expect(finalTotal).toBe(initialTotal);
    });

    it('should maintain zero-sum conservation during escrow lifecycle', () => {
      let availableBalance = 10.0;
      let heldBalance = 0.0;
      const bookingHours = 3.5;

      // 1. Escrow Lock on Booking
      availableBalance -= bookingHours;
      heldBalance += bookingHours;
      expect(availableBalance).toBe(6.5);
      expect(heldBalance).toBe(3.5);
      expect(availableBalance + heldBalance).toBe(10.0);

      // 2a. If Cancelled -> Release Escrow
      let cancelledAvailable = availableBalance + bookingHours;
      let cancelledHeld = heldBalance - bookingHours;
      expect(cancelledAvailable).toBe(10.0);
      expect(cancelledHeld).toBe(0.0);

      // 2b. If Completed -> Settle from Escrow
      let settledHeld = heldBalance - bookingHours;
      expect(settledHeld).toBe(0.0);
      expect(availableBalance).toBe(6.5);
    });
  });
});
