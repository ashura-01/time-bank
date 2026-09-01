export class User {
  static Roles = Object.freeze({
    USER: 'user',
    ADMIN: 'admin'
  });

  constructor(data = {}) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.phone = data.phone;
    this.address = data.address;
    this.bio = data.bio;
    this.avatar_url = data.avatar_url;
    this.role = data.role || User.Roles.USER;
    this.time_balance = Number(data.time_balance || 0);
    this.held_balance = Number(data.held_balance || 0);
    this.is_active = Boolean(data.is_active ?? true);
    this.email_verified = Boolean(data.email_verified ?? false);
    this.avg_rating = data.avg_rating ? Number(data.avg_rating) : null;
    this.review_count = Number(data.review_count || 0);
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  get fullName() {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim();
  }

  isAdmin() {
    return this.role === User.Roles.ADMIN;
  }

  hasSufficientBalance(requiredHours) {
    return this.time_balance >= requiredHours;
  }

  canTransact() {
    return this.is_active;
  }

  toPublicProfile() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      phone: this.phone,
      address: this.address,
      bio: this.bio,
      avatar_url: this.avatar_url,
      role: this.role,
      time_balance: this.time_balance,
      held_balance: this.held_balance,
      is_active: this.is_active,
      email_verified: this.email_verified,
      avg_rating: this.avg_rating,
      review_count: this.review_count,
      created_at: this.created_at
    };
  }

  toAuthJSON() {
    const { password_hash: _, ...safeUser } = this.toPublicProfile();
    return safeUser;
  }
}

export default User;
