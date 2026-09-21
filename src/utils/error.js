function formatError(error) {
  const response = error.response;

  if (response && response.data) {
    const data = response.data;
    const detail =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);

    return `${response.status} ${response.statusText || ""}\n${detail}`.trim();
  }

  return error.message;
}

module.exports = { formatError };