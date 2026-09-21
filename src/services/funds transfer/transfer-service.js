class TransferService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async transfer(payload) {
    return this.apiClient.request(
      "/services/connect-gateway/api/v1/interbank/fund/transfer",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }
}

module.exports = TransferService;