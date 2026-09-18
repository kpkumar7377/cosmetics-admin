"use client";

import { useEffect, useState } from "react";
import ProductForm from "../../../../components/ProductForm";
import api from "../../../../lib/api";

export default function EditProductClient({ id }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api.get(`/products/admin/${id}`).then((res) => setProduct(res.data));
  }, [id]);

  if (!product) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Edit Product</h1>
      <ProductForm initialProduct={product} />
    </div>
  );
}
