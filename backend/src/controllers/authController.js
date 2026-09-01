import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/userRepository.js';
import { User } from '../models/index.js';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/index.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    const user = await userRepository.create({
      id,
      email,
      passwordHash: password_hash,
      firstName: first_name,
      lastName: last_name,
      phone
    });

    const token = generateToken(id);
    setTokenCookie(res, token);

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const rawUser = await userRepository.findByEmail(email);
    if (!rawUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = new User(rawUser);
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.canTransact()) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.json({ user: user.toAuthJSON(), token });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, address, bio, avatar_url } = req.body;
    const userId = req.user.id;

    const user = await userRepository.updateProfile(userId, {
      first_name,
      last_name,
      phone,
      address,
      bio,
      avatar_url
    });

    if (!user) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    const currentHash = await userRepository.findPasswordHashById(userId);
    if (!currentHash) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(current_password, currentHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await userRepository.updatePassword(userId, password_hash);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};