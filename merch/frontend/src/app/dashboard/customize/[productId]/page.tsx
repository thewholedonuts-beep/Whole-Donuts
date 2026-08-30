import { ProductCustomizer } from '@/components/ProductCustomizer';
import type { Product } from '@/components/ProductCustomizer';
import { apiRequest } from '@/lib/api';

type PageProps = {
  params: {
    productId: string;
  };
};

async function getProduct(productId: string): Promise<Product> {
  const response = await apiRequest<{ product: Product }>(`/products/${productId}`);
  return response.product;
}

export default async function CustomizeProductPage({ params }: PageProps) {
  try {
    const product = await getProduct(params.productId);

    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <ProductCustomizer product={product} />
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-red-100 shadow-card">
          <h1 className="text-3xl font-semibold text-white">Unable to load product customizer</h1>
          <p className="mt-4 text-sm text-red-100/90">
            {error instanceof Error ? error.message : 'Please verify the backend is running and the product exists.'}
          </p>
        </div>
      </main>
    );
  }
}
