/**
 * Takes an async function as an argument and returns an express
 * middleware function that calls the async function.
 * @param {Function} asyncFn - An async function
 */
function asyncHandler(asyncFn) {
  return (req, res, next) => {
    return Promise.resolve(asyncFn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
