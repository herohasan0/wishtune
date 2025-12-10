const { Polar } = require('@polar-sh/sdk');

async function listProducts() {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) {
    console.error('No token provided');
    return;
  }

  const polar = new Polar({
    accessToken: token,
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  });

  try {
    const response = await polar.products.list({});
    console.log('Polar Products:');
    response.result.items.forEach(product => {
      console.log(`- Name: ${product.name}`);
      console.log(`  ID: ${product.id}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

listProducts();
