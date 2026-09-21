function getConfig() {
  const secretKey = process.env.REMITA_SECRETKEY;

  if (!secretKey) {
    throw new Error(
      "REMITA_SECRETKEY is not configured. Set it before using the CLI."
    );
  }

  return {
    baseUrl:
      process.env.REMITA_BASE_URL ||
      "https://api-demo.systemspecsng.com",

    secretKey,
  };
}

module.exports = {
  getConfig,
};