export class Review {
  static MIN_RATING = 1;
  static MAX_RATING = 5;

  constructor(data = {}) {
    this.id = data.id;
    this.transaction_id = data.transaction_id;
    this.reviewer_id = data.reviewer_id;
    this.reviewee_id = data.reviewee_id;
    this.rating = Number(data.rating || 5);
    this.comment = data.comment;
    this.created_at = data.created_at;

    // Joined fields
    this.reviewer_first = data.reviewer_first;
    this.reviewer_last = data.reviewer_last;
    this.reviewer_avatar = data.reviewer_avatar;
    this.service_title = data.service_title;
  }

  static isValidRating(rating) {
    const num = Number(rating);
    return Number.isInteger(num) && num >= Review.MIN_RATING && num <= Review.MAX_RATING;
  }

  static getRevieweeId(transaction, reviewerId) {
    if (transaction.requester_id === reviewerId) {
      return transaction.provider_id;
    }
    if (transaction.provider_id === reviewerId) {
      return transaction.requester_id;
    }
    return null;
  }
}

export default Review;
