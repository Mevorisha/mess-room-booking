/**
 * @param {object} response
 * @param {number} status
 * @param {string} message
 */
function messageResponse(response, status, message) {
  return response.status(status).json({ status, message });
}

module.exports = messageResponse;
