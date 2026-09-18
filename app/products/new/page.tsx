import ProductForm from "../../../components/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Add Product</h1>
      <ProductForm initialProduct={{}} />
    </div>
  );
}
