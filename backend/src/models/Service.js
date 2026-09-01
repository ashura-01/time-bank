export class Service {
  static Type = Object.freeze({
    OFFER: 'offer',
    REQUEST: 'request'
  });

  static Status = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    COMPLETED: 'completed'
  });

  constructor(data = {}) {
    this.id = data.id;
    this.provider_id = data.provider_id;
    this.category_id = data.category_id;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type || Service.Type.OFFER;
    this.duration_hours = Number(data.duration_hours || 1.0);
    this.location = data.location;
    this.is_remote = Boolean(data.is_remote);
    this.status = data.status || Service.Status.ACTIVE;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // Joined fields
    this.category_name = data.category_name;
    this.category_icon = data.category_icon;
    this.category_color = data.category_color;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.avatar_url = data.avatar_url;
    this.tags = data.tags || [];
  }

  isOffer() {
    return this.type === Service.Type.OFFER;
  }

  isRequest() {
    return this.type === Service.Type.REQUEST;
  }

  isAvailable() {
    return this.status === Service.Status.ACTIVE;
  }

  canModify(userId, userRole = 'user') {
    return this.provider_id === userId || userRole === 'admin';
  }

  canTransactWith(userId) {
    return this.provider_id !== userId && this.isAvailable();
  }
}

export default Service;
