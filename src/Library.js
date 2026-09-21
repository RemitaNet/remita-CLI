const RemitaApiClient = require("./api/client");

const BankService = require("./services/funds transfer/bank-service");
const NameEnquiryService = require("./services/funds transfer/NameEnquiry-service");
const TransferService = require("./services/funds transfer/transfer-service");
const QueryService = require("./services/funds transfer/query-service");

// const BulkTransferService = require("./services/funds transfer/bulk/bulk-transfer-service");
const BulkQueryService = require("./services/funds transfer/bulk/bulk-query-service");
const BulkDetailService = require("./services/funds transfer/bulk/bulk-details-service");
const BulkTransactionStatusService = require("./services/funds transfer/bulk/bulk-transaction-status-service");

const ChargeService = require("./services/Online Payments/charge-service");
const VerifyService = require("./services/Online Payments/verify-service");

const TokenService = require("./services/Authentication/token-service");

const VendingService = require("./services/vending/vending-service");

class RemitaClient {
  constructor({
    baseUrl = "https://api-demo.systemspecsng.com",
    authBaseUrl = "https://demo.remita.net",
    secretKey,
  }) {
    this.apiClient = new RemitaApiClient({
      baseUrl,
      secretKey,
    });

    this.authApiClient = new RemitaApiClient({
      baseUrl: authBaseUrl,
    });

    this.fundsTransfer = {
      banks: new BankService(this.apiClient),
      nameEnquiry: new NameEnquiryService(this.apiClient),
      transfer: new TransferService(this.apiClient),
      query: new QueryService(this.apiClient),

      bulk: {
        // transfer: new BulkTransferService(this.apiClient),
        query: new BulkQueryService(this.apiClient),
        detail: new BulkDetailService(this.apiClient),
        transactionStatus: new BulkTransactionStatusService(this.apiClient),
      },
    };

    this.onlinePayments = {
      charge: new ChargeService(this.apiClient),
      verify: new VerifyService(this.apiClient),
    };

    this.authentication = {
      token: new TokenService(this.authApiClient),
    };

    this.vending = {
      service: new VendingService(this.apiClient),
    };
  }
}

module.exports = {
  RemitaClient,
};