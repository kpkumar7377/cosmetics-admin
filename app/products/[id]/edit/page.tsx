import EditProductClient from "./EditProductClient";

export default function EditProductPage({ params }) {
  return <EditProductClient id={params.id} />;
}
