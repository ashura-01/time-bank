import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const list = errors.array();
    return res.status(400).json({ error: list[0].msg, errors: list });
  }
  next();
};

export const handleError = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with this information already exists.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'The referenced record does not exist.' });
  }
  // Never leak internal database query or column details to client
  res.status(500).json({ error: 'An error occurred while processing your request. Please try again.' });
};