class TokenService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async generateToken(username, password) {
    return this.apiClient.request(
      "/remita/exapp/api/v1/send/api/uaasvc/uaa/token",
      {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );
  }
}

module.exports = TokenService;