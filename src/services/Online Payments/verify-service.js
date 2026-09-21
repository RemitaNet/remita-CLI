class VerifyService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async verify(transRef) {
    return this.apiClient.request(
      `/services/connect-gateway/api/v1/payment-engine/payment/merchant/verify/${encodeURIComponent(
        transRef
      )}`,
      {
        method: "GET",
      }
    );
  }
}

module.exports = VerifyService;