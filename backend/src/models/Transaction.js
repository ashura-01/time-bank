export class Transaction {
  static Status = Object.freeze({
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed'
  });

  constructor(data = {}) {
    this.id = data.id;
    this.service_id = data.service_id;
    this.requester_id = data.requester_id;
    this.provider_id = data.provider_id;
    this.hours_exchanged = Number(data.hours_exchanged || 0);
    this.status = data.status || Transaction.Status.PENDING;
    this.scheduled_at = data.scheduled_at;
    this.location = data.location;
    this.is_remote = Boolean(data.is_remote);
    this.requester_completed_at = data.requester_completed_at;
    this.provider_completed_at = data.provider_completed_at;
    this.completed_at = data.completed_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // Joined fields if available
    this.service_title = data.service_title;
    this.service_type = data.service_type;
    this.requester_first = data.requester_first;
    this.requester_last = data.requester_last;
    this.requester_email = data.requester_email;
    this.provider_first = data.provider_first;
    this.provider_last = data.provider_last;
    this.provider_email = data.provider_email;
    this.ledger_entries = data.ledger_entries || [];
  }

  isParticipant(userId) {
    return this.requester_id === userId || this.provider_id === userId;
  }

  isRequester(userId) {
    return this.requester_id === userId;
  }

  isProvider(userId) {
    return this.provider_id === userId;
  }

  canConfirm(userId) {
    return this.isProvider(userId) && this.status === Transaction.Status.PENDING;
  }

  canCancel(userId, userRole = 'user') {
    if (this.status === Transaction.Status.COMPLETED) {
      return false;
    }
    return this.isParticipant(userId) || userRole === 'admin';
  }

  canRecordCompletion(userId) {
    if (!this.isParticipant(userId)) return false;
    if (this.status !== Transaction.Status.CONFIRMED) return false;
    return !this.hasUserCompleted(userId);
  }

  hasUserCompleted(userId) {
    if (this.isRequester(userId)) return Boolean(this.requester_completed_at);
    if (this.isProvider(userId)) return Boolean(this.provider_completed_at);
    return false;
  }

  getCompletionColumn(userId) {
    return this.isRequester(userId) ? 'requester_completed_at' : 'provider_completed_at';
  }

  isDualConfirmed() {
    return Boolean(this.requester_completed_at && this.provider_completed_at);
  }

  getParties(serviceType) {
    const isOffer = serviceType === 'offer';
    return {
      payerId: isOffer ? this.requester_id : this.provider_id,
      payeeId: isOffer ? this.provider_id : this.requester_id,
      isOffer
    };
  }
}

export default Transaction;
