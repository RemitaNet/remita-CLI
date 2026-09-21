const BASE_PATH = "/services/connect-gateway/api/v1/vending";

class VendingService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async getProvidersByCategory(categoryId) {
    return this.apiClient.request(
      `${BASE_PATH}/providers/category/${encodeURIComponent(categoryId)}`,
      {
        method: "GET",
      }
    );
  }

  async getProducts(params) {
    return this.apiClient.request(
      `${BASE_PATH}/products`,
      {
        method: "GET",
        // params will need to be handled according to your API client's request implementation
      }
    );
  }

  async validate(payload) {
    return this.apiClient.request(
      `${BASE_PATH}/validate`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async transact(payload) {
    return this.apiClient.request(
      `${BASE_PATH}/transactions`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async queryTransaction(clientReference) {
    return this.apiClient.request(
      `${BASE_PATH}/query-transaction/${encodeURIComponent(clientReference)}`,
      {
        method: "GET",
      }
    );
  }
}

module.exports = VendingService;