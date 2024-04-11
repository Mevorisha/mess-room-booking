const Joi = require("joi");
const messageResponse = require("../util/messageResponse");

/**
 * Create a middleware function to validate a request or response
 * @param {'request' | 'response'} key - The key to validate
 * @param {object} endpoint - The endpoint schema to validate against
 * @returns {function} - The middleware function
 *
 * @example
 * ```
 * const { validate } = require("/opt/validator/validate");
 * const { authSchema } = require("/opt/validator/endpoints/auth");
 *
 * app.post(
 *   "/register",
 *   validate("request", authSchema.REGISTER),
 *   Controller.register,
 *   validate("response", authSchema.REGISTER),
 * );
 * ```
 */
function validate(key, endpoint) {
  if (key !== "request" && key !== "response") {
    throw new Error("Invalid validator key, must be 'request' or 'response'");
  }

  return (req, res, next) => {
    const errors = [];
    const scehmas = {
      headers: endpoint[key].headers,
      body: endpoint[key].body,
      params: endpoint[key].params,
      query: endpoint[key].query,
    };

    for (const [key, schema] of Object.entries(scehmas)) {
      if (schema) {
        const { error } = Joi.object(schema).validate(req[key]);
        if (error) {
          errors.push(error.details[0].message);
        }
      }
    }

    if (errors.length) {
      if (key === "request") {
        messageResponse(res, 400, errors.join("\n"));
      } else {
        messageResponse(res, 500, errors.join("\n"));
      }
      return false;
    }

    if (next) next();
    return true;
  };
}

/**
 * Non-middleware function to validate an object against a schema
 * @param {object} req - The request object to validate
 * @param {object} res - The response object to send validation errors
 * @param {object} schema - The schema to validate against
 * @returns {boolean} - True if the object is valid, false otherwise
 *
 * @example
 * ```
 * const { validateReqOrSendErr } = require("/opt/validator/validate");
 * const { authSchema } = require("/opt/validator/endpoints/auth");
 *
 * const isValid = validateReqOrSendErr(req, res, authSchema.REGISTER);
 * ```
 */
function validateReqOrSendErr(req, res, schema) {
  return validate(schema, "request")(req, res);
}

/**
 * Non-middleware function called before sending a response to validate the response object
 * If the response object is invalid, an error message is sent to the client
 * If the response object is valid, the response is sent to the client
 * @param {object} req - The request object is not used but required
 * @param {object} res - The response object to validate
 * @param {object} schema - The schema to validate against
 *
 * @example
 * ```
 * const { validateResAndSend } = require("/opt/validator/validate");
 * const { authSchema } = require("/opt/validator/endpoints/auth");
 *
 * app.post("/register", (req, res) => {
 *   const stat = validateReqOrSendErr(req, res, authSchema.REGISTER);
 *   if (!stat) return;
 *
 *   const response = Controller.register(req, res);
 *   return validateResAndSend(req, res, authSchema.REGISTER);
 * });
 * ```
 */
function validateResAndSend(req, res, schema) {
  return validate(schema, "response")(req, res);
}

module.exports = {
  validate,
  validateReqOrSendErr,
  validateResAndSend,
};
