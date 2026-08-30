function printfulConfig() {
  const token = process.env.PRINTFUL_API_KEY;
  if (!token) {
    throw new Error('Printful credentials are not configured.');
  }

  return {
    baseUrl: process.env.PRINTFUL_API_BASE_URL || 'https://api.printful.com',
    token,
  };
}

async function printfulRequest(path, options = {}) {
  const { baseUrl, token } = printfulConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Printful request failed with status ${response.status}.`);
  }

  return response.json();
}

async function getStoreInfo() {
  return printfulRequest('/store');
}

module.exports = {
  getStoreInfo,
  printfulRequest,
};
