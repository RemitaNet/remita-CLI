const { Command } = require("commander");

const RemitaApiClient = require("../../api/client");
const TokenService = require("../../services/Authentication/token-service");
const { printJson } = require("../../utils/output");

function createTokenCommand() {
  const token = new Command("token");

  token
    .description("Generate an authentication token")
    .requiredOption("--username <username>", "Authentication username")
    .requiredOption("--password <password>", "Authentication password")
    .action(async (options) => {
      try {
        const baseUrl =
          process.env.REMITA_AUTH_BASE_URL ||
          "https://demo.remita.net";

        const apiClient = new RemitaApiClient({
          baseUrl,
          secretKey: "",
        });

        const tokenService = new TokenService(apiClient);

        const result = await tokenService.generateToken(
          options.username,
          options.password
        );

        printJson(result);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });

  return token;
}

module.exports = createTokenCommand;