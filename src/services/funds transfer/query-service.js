class QueryService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async queryTransaction(paymentIdentifier) {
    return this.apiClient.request(
      `/services/connect-gateway/api/v1/interbank/query-transaction/${encodeURIComponent(paymentIdentifier)}`,
      {
        method: "GET",
      }
    );
  }
}

module.exports = QueryService;