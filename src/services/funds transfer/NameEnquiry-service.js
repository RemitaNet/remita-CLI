class NameEnquiryService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async enquire(bankCode, accountNumber) {
    return this.apiClient.request(
      "/services/connect-gateway/api/v1/interbank/name/enquiry",
      {
        method: "POST",
        body: JSON.stringify({
          destinationBankCode: bankCode,
          destinationAccountNumber: accountNumber,
        }),
      }
    );
  }
}

module.exports = NameEnquiryService;