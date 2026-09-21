const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const { getConfig } = require("../../config/config-service");
const VendingService = require("../../services/Vending/vending-service");
const { printJson } = require("../../utils/output");
const { formatError } = require("../../utils/error");

function parseInteger(flag) {
  return (value) => {
    if (!/^\d+$/.test(value)) {
      throw new Error(`${flag} must be a non-negative integer`);
    }

    return Number(value);
  };
}

function createProductsCommand() {
  const products = new Command("products");

  products
    .description("List vending products")
    .option("--page <page>", "Page number (zero-based)", parseInteger("--page"), 0)
    .option(
      "--page-size <pageSize>",
      "Results per page",
      parseInteger("--page-size"),
      20
    )
    .option("--country-code <countryCode>", "Country code", "NGA")
    .option("--category-code <categoryCode>", "Category code")
    .option("--provider <provider>", "Provider code")
    .option("--product-type <productType>", "Product type, e.g. DYNAMIC")
    .option("--code <code>", "Product code filter")
    .action(async (options) => {
      try {
        const params = {
          page: options.page,
          pageSize: options.pageSize,
          countryCode: options.countryCode,
          categoryCode: options.categoryCode,
          provider: options.provider,
          productType: options.productType,
          code: options.code,
        };

        Object.keys(params).forEach((key) => {
          if (params[key] === undefined || params[key] === "") {
            delete params[key];
          }
        });

        const config = getConfig();
        const apiClient = new RemitaApiClient(config);
        const vendingService = new VendingService(apiClient);

        const result = await vendingService.getProducts(params);

        printJson(result);
      } catch (error) {
        console.error(`Error: ${formatError(error)}`);
        process.exitCode = 1;
      }
    });

  return products;
}

module.exports = createProductsCommand;