class BankService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async listBanks() {
    return this.apiClient.request(
      "/services/connect-gateway/api/v1/interbank/transaction/bank/list",
      {
        method: "GET",
      }
    );
  }
}

module.exports = BankService;