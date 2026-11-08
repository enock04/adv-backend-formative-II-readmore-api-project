// Copy only the whitelisted fields from a request body,
// so clients can't slip in _id, createdAt, etc.
function pickFields(body, allowed) {
  const picked = {};
  for (const field of allowed) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
}

module.exports = pickFields;
