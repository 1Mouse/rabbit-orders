import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"

import { loadOrderListQuery } from "@/features/orders/query-state"
import { listOrders } from "@/features/orders/server/list-orders"
import { OrderTable } from "@/features/orders/ui/order-table"

export const metadata: Metadata = {
  title: "Orders",
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const query = await loadOrderListQuery(searchParams)
  const data = listOrders(query)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track all customer orders.
        </p>
      </div>
      <OrderTable data={data} />
    </main>
  )
}
