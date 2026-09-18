import OrderDetailClient from "./OrderDetailClient";

export default function OrderDetailPage({ params }) {
  return <OrderDetailClient id={params.id} />;
}
