export class Dispute {
  static Status = Object.freeze({
    OPEN: 'open',
    UNDER_REVIEW: 'under_review',
    RESOLVED: 'resolved',
    REJECTED: 'rejected'
  });

  constructor(data = {}) {
    this.id = data.id;
    this.transaction_id = data.transaction_id;
    this.raised_by = data.raised_by;
    this.reason = data.reason;
    this.evidence = data.evidence;
    this.status = data.status || Dispute.Status.OPEN;
    this.resolution = data.resolution;
    this.resolved_by = data.resolved_by;
    this.resolved_at = data.resolved_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // Joined fields
    this.service_id = data.service_id;
    this.service_title = data.service_title;
    this.raised_first = data.raised_first;
    this.raised_last = data.raised_last;
    this.raised_email = data.raised_email;
    this.requester_id = data.requester_id;
    this.requester_first = data.requester_first;
    this.requester_last = data.requester_last;
    this.provider_id = data.provider_id;
    this.provider_first = data.provider_first;
    this.provider_last = data.provider_last;
    this.resolved_first = data.resolved_first;
    this.resolved_last = data.resolved_last;
  }

  isParticipant(userId) {
    return (
      this.raised_by === userId ||
      this.requester_id === userId ||
      this.provider_id === userId
    );
  }

  canView(userId, userRole = 'user') {
    return userRole === 'admin' || this.isParticipant(userId);
  }

  canResolve(userRole = 'user') {
    return userRole === 'admin';
  }
}

export default Dispute;
