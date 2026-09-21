class BulkTransactionStatusService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async getStatus(bulkReference, transactionReference) {
    return this.apiClient.request(
      `/services/connect-gateway/api/v1/interbank/bulk/single-transaction/status/${encodeURIComponent(
        bulkReference
      )}/${encodeURIComponent(transactionReference)}`,
      {
        method: "GET",
      }
    );
  }
}

module.exports = BulkTransactionStatusService;