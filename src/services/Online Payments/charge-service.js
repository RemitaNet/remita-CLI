class ChargeService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async charge(payload) {
    return this.apiClient.request(
      "/services/connect-gateway/api/v1/payment/charge",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }
}

module.exports = ChargeService;