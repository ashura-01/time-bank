import { User, Transaction, Service, Dispute, Review, LedgerEntry } from '../src/models/index.js';

describe('Domain Models Test Suite', () => {
  describe('User Model', () => {
    it('should correctly evaluate balance sufficiency', () => {
      const user = new User({ time_balance: 5.0, held_balance: 2.0 });
      expect(user.hasSufficientBalance(5.0)).toBe(true);
      expect(user.hasSufficientBalance(5.01)).toBe(false);
      expect(user.hasSufficientBalance(3.0)).toBe(true);
    });

    it('should identify admin roles', () => {
      const regular = new User({ role: 'user' });
      const admin = new User({ role: 'admin' });
      expect(regular.isAdmin()).toBe(false);
      expect(admin.isAdmin()).toBe(true);
    });

    it('should safely serialize auth data without exposing password_hash', () => {
      const user = new User({
        id: 'u1',
        email: 'test@example.com',
        password_hash: '$2a$12$secretHash',
        first_name: 'Jane',
        last_name: 'Doe',
        time_balance: 10
      });
      const authJson = user.toAuthJSON();
      expect(authJson.password_hash).toBeUndefined();
      expect(authJson.email).toBe('test@example.com');
      expect(authJson.id).toBe('u1');
    });
  });

  describe('Transaction Model', () => {
    const sampleTx = new Transaction({
      id: 'tx-100',
      requester_id: 'user-req',
      provider_id: 'user-prov',
      hours_exchanged: 3.5,
      status: Transaction.Status.PENDING,
      service_id: 'srv-1'
    });

    it('should check participant membership', () => {
      expect(sampleTx.isParticipant('user-req')).toBe(true);
      expect(sampleTx.isParticipant('user-prov')).toBe(true);
      expect(sampleTx.isParticipant('random-user')).toBe(false);
    });

    it('should only allow provider to confirm pending transactions', () => {
      expect(sampleTx.canConfirm('user-prov')).toBe(true);
      expect(sampleTx.canConfirm('user-req')).toBe(false);
    });

    it('should resolve payer and payee correctly for offers vs requests', () => {
      const offerParties = sampleTx.getParties('offer');
      expect(offerParties.payerId).toBe('user-req');
      expect(offerParties.payeeId).toBe('user-prov');

      const requestParties = sampleTx.getParties('request');
      expect(requestParties.payerId).toBe('user-prov');
      expect(requestParties.payeeId).toBe('user-req');
    });

    it('should track two-sided completion state accurately', () => {
      const confirmedTx = new Transaction({
        id: 'tx-200',
        requester_id: 'req',
        provider_id: 'prov',
        status: Transaction.Status.CONFIRMED,
        requester_completed_at: null,
        provider_completed_at: null
      });

      expect(confirmedTx.isDualConfirmed()).toBe(false);
      expect(confirmedTx.canRecordCompletion('req')).toBe(true);

      const halfConfirmed = new Transaction({
        ...confirmedTx,
        requester_completed_at: '2026-08-30T10:00:00Z'
      });
      expect(halfConfirmed.isDualConfirmed()).toBe(false);
      expect(halfConfirmed.canRecordCompletion('req')).toBe(false);
      expect(halfConfirmed.canRecordCompletion('prov')).toBe(true);

      const fullyConfirmed = new Transaction({
        ...confirmedTx,
        requester_completed_at: '2026-08-30T10:00:00Z',
        provider_completed_at: '2026-08-30T10:05:00Z'
      });
      expect(fullyConfirmed.isDualConfirmed()).toBe(true);
    });
  });

  describe('Service Model', () => {
    it('should determine permissions and availability', () => {
      const activeService = new Service({
        id: 's-1',
        provider_id: 'prov-1',
        status: Service.Status.ACTIVE,
        type: Service.Type.OFFER
      });

      expect(activeService.isOffer()).toBe(true);
      expect(activeService.isRequest()).toBe(false);
      expect(activeService.isAvailable()).toBe(true);
      expect(activeService.canModify('prov-1')).toBe(true);
      expect(activeService.canModify('other-user')).toBe(false);
      expect(activeService.canModify('other-user', 'admin')).toBe(true);
      expect(activeService.canTransactWith('other-user')).toBe(true);
      expect(activeService.canTransactWith('prov-1')).toBe(false);
    });
  });

  describe('Dispute & Review Models', () => {
    it('should validate review rating range', () => {
      expect(Review.isValidRating(1)).toBe(true);
      expect(Review.isValidRating(5)).toBe(true);
      expect(Review.isValidRating(3.5)).toBe(false);
      expect(Review.isValidRating(0)).toBe(false);
      expect(Review.isValidRating(6)).toBe(false);
      expect(Review.isValidRating('invalid')).toBe(false);
    });

    it('should determine reviewee counterparty correctly', () => {
      const tx = { requester_id: 'userA', provider_id: 'userB' };
      expect(Review.getRevieweeId(tx, 'userA')).toBe('userB');
      expect(Review.getRevieweeId(tx, 'userB')).toBe('userA');
      expect(Review.getRevieweeId(tx, 'userC')).toBeNull();
    });

    it('should enforce dispute authorization', () => {
      const dispute = new Dispute({
        id: 'd-1',
        raised_by: 'userA',
        requester_id: 'userA',
        provider_id: 'userB'
      });

      expect(dispute.canView('userA')).toBe(true);
      expect(dispute.canView('userB')).toBe(true);
      expect(dispute.canView('userC')).toBe(false);
      expect(dispute.canView('userC', 'admin')).toBe(true);
      expect(dispute.canResolve('user')).toBe(false);
      expect(dispute.canResolve('admin')).toBe(true);
    });
  });
});
