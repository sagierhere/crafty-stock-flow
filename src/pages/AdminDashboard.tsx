import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, ShoppingCart, Truck, CircleDollarSign, Activity } from 'lucide-react';
import { dashboardService } from '@/services/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminDashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardService.getAdminSummary,
    staleTime: 60_000,
  });

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
    [],
  );

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }),
    [],
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

  const stats = [
    {
      title: 'Total products',
      icon: Package,
      value: data?.totalProducts ?? 0,
    },
    {
      title: 'Total customers',
      icon: Users,
      value: data?.totalCustomers ?? 0,
    },
    {
      title: 'Total orders',
      icon: ShoppingCart,
      value: data?.totalOrders ?? 0,
    },
    {
      title: 'Total suppliers',
      icon: Truck,
      value: data?.totalSuppliers ?? 0,
    },
    {
      title: 'Inventory value',
      icon: CircleDollarSign,
      value: data?.totalInventoryValue ?? 0,
      isCurrency: true,
    },
  ];

  const renderStatValue = (stat: (typeof stats)[number]) => {
    if (isLoading) {
      return <Skeleton className="h-8 w-20" />;
    }

    return (
      <div className="text-2xl font-bold">
        {stat.isCurrency ? currencyFormatter.format(stat.value) : numberFormatter.format(stat.value)}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="text-muted-foreground">
            Monitor company-wide activity and jump into management tools below.
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load dashboard</AlertTitle>
            <AlertDescription>
              Please refresh the page or check the API status. The statistics below may be out of date.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>{renderStatValue(stat)}</CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest confirmed orders that are not canceled.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.recentOrders?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Order date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.customerName}</TableCell>
                          <TableCell>{dateTimeFormatter.format(new Date(order.orderedAtUtc))}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(order.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No orders recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low-stock products</CardTitle>
              <CardDescription>Items at or below their configured reorder level.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : data?.lowStockProducts?.length ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-2">
                    {data.lowStockProducts.map((product) => (
                      <div key={product.id} className="rounded-md border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{product.name}</p>
                          <Badge variant="destructive">{product.stockQuantity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku} · Reorder at {numberFormatter.format(product.reorderLevel)} units
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">All products are above their reorder levels.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Latest user activity
              </CardTitle>
              <CardDescription>Most recent administrative actions.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : data?.recentUserActivities?.length ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-2">
                    {data.recentUserActivities.map((activity) => (
                      <div key={activity.id} className="space-y-1 rounded-md border border-border p-3 text-sm">
                        <div className="flex items-center justify-between font-medium">
                          <span>{activity.activityType}</span>
                          <span className="text-xs text-muted-foreground">
                            {dateTimeFormatter.format(new Date(activity.occurredAtUtc))}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No user activity has been recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
