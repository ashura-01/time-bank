export class LedgerEntry {
  static Type = Object.freeze({
    CREDIT: 'credit',
    DEBIT: 'debit'
  });

  constructor(data = {}) {
    this.id = data.id;
    this.transaction_id = data.transaction_id;
    this.user_id = data.user_id;
    this.entry_type = data.entry_type || LedgerEntry.Type.CREDIT;
    this.hours = Number(data.hours || 0);
    this.balance_after = Number(data.balance_after || 0);
    this.description = data.description;
    this.created_at = data.created_at;

    // Joined fields
    this.service_id = data.service_id;
    this.service_title = data.service_title;
  }

  isCredit() {
    return this.entry_type === LedgerEntry.Type.CREDIT;
  }

  isDebit() {
    return this.entry_type === LedgerEntry.Type.DEBIT;
  }
}

export default LedgerEntry;
