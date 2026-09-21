class BulkDetailService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async getDetail(bulkReference) {
    return this.apiClient.request(
      `/services/connect-gateway/api/v1/interbank/bulk/transaction/detail/${encodeURIComponent(
        bulkReference
      )}`,
      {
        method: "GET",
      }
    );
  }
}

module.exports = BulkDetailService;