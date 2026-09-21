class BulkQueryService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async queryTransaction(bulkReference) {
    return this.apiClient.request(
      `/services/connect-gateway/api/v1/interbank/bulk/query-transaction/${encodeURIComponent(
        bulkReference
      )}`,
      {
        method: "GET",
      }
    );
  }
}

module.exports = BulkQueryService;