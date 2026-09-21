class RemitaApiClient {
  constructor({ baseUrl, secretKey }) {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        secretKey: this.secretKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const contentType = response.headers.get("content-type");

    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(
        typeof data === "object"
          ? data.message || "Remita API request failed"
          : data || "Remita API request failed"
      );
    }

    return data;
  }
}

module.exports = RemitaApiClient;