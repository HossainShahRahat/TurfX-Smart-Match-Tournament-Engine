export function createHttpError(message, statusCode, metadata = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.metadata = metadata;
  return error;
}
