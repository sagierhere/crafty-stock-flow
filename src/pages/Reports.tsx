import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reportsService, TransactionType } from '@/services/reports';
import { productsService } from '@/services/products';
import { suppliersService } from '@/services/suppliers';
import { customersService } from '@/services/customers';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

interface ReportFilters {
  fromDate: string;
  toDate: string;
  productId: string;
  supplierId: string;
  customerId: string;
}

const ANY_OPTION = 'any';

const transactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.Sale]: 'Sale',
  [TransactionType.Restock]: 'Restock',
  [TransactionType.Adjustment]: 'Adjustment',
  [TransactionType.Return]: 'Return',
};

const transactionBadgeStyles: Record<TransactionType, string> = {
  [TransactionType.Sale]: 'bg-emerald-100 text-emerald-800',
  [TransactionType.Restock]: 'bg-blue-100 text-blue-800',
  [TransactionType.Adjustment]: 'bg-amber-100 text-amber-800',
  [TransactionType.Return]: 'bg-rose-100 text-rose-800',
};

const Reports = () => {
  const { toast } = useToast();

  const initialFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const initialTo = format(new Date(), 'yyyy-MM-dd');

  const [formFilters, setFormFilters] = useState<ReportFilters>({
    fromDate: initialFrom,
    toDate: initialTo,
    productId: ANY_OPTION,
    supplierId: ANY_OPTION,
    customerId: ANY_OPTION,
  });

  const [activeFilters, setActiveFilters] = useState<ReportFilters>(formFilters);

  const { data: products } = useQuery({ queryKey: ['products', 'all'], queryFn: productsService.getAll });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers', 'all'], queryFn: suppliersService.getAll });
  const { data: customers } = useQuery({ queryKey: ['customers', 'all'], queryFn: customersService.getAll });

  const toOptionalGuid = (value: string) => (value === ANY_OPTION ? null : value);

  const reportQuery = useQuery({
    queryKey: [
      'inventory-report',
      activeFilters.fromDate,
      activeFilters.toDate,
      activeFilters.productId,
      activeFilters.supplierId,
      activeFilters.customerId,
    ] as const,
    queryFn: () =>
      reportsService.getInventoryReport({
        fromUtc: activeFilters.fromDate ? new Date(activeFilters.fromDate).toISOString() : null,
        toUtc: activeFilters.toDate ? new Date(activeFilters.toDate).toISOString() : null,
        productId: toOptionalGuid(activeFilters.productId),
        supplierId: toOptionalGuid(activeFilters.supplierId),
        customerId: toOptionalGuid(activeFilters.customerId),
      }),
    retry: 1,
  });

  useEffect(() => {
    if (!reportQuery.isError || !reportQuery.error) {
      return;
    }

    const message = reportQuery.error instanceof Error ? reportQuery.error.message : 'Unable to load report';
    toast({ title: 'Report error', description: message, variant: 'destructive' });
  }, [reportQuery.isError, reportQuery.error, toast]);

  const report = reportQuery.data;

  const stats = useMemo(
    () => ({
      lowStockCount: report?.lowStockProducts.length ?? 0,
      transactionCount: report?.recentTransactions.length ?? 0,
      topCustomersCount: report?.topCustomers.length ?? 0,
      generatedAt: report?.generatedAtUtc ? format(new Date(report.generatedAtUtc), 'PPpp') : undefined,
    }),
    [report],
  );

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setActiveFilters(formFilters);
  };

  const resetFilters = () => {
    const reset = {
      fromDate: initialFrom,
      toDate: initialTo,
      productId: ANY_OPTION,
      supplierId: ANY_OPTION,
      customerId: ANY_OPTION,
    } satisfies ReportFilters;
    setFormFilters(reset);
    setActiveFilters(reset);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Inventory reports</h1>
          <p className="text-muted-foreground">Track stock risk, recent movements, and top customers in one place.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <p className="text-sm text-muted-foreground">Adjust the reporting window or focus on specific products, suppliers, or customers.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={applyFilters}>
              <div className="space-y-2">
                <Label htmlFor="from-date">From</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={formFilters.fromDate}
                  max={formFilters.toDate || undefined}
                  onChange={(event) => setFormFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-date">To</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={formFilters.toDate}
                  min={formFilters.fromDate || undefined}
                  onChange={(event) => setFormFilters((prev) => ({ ...prev, toDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={formFilters.productId}
                  onValueChange={(value) => setFormFilters((prev) => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_OPTION}>All products</SelectItem>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={formFilters.supplierId}
                  onValueChange={(value) => setFormFilters((prev) => ({ ...prev, supplierId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_OPTION}>All suppliers</SelectItem>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={formFilters.customerId}
                  onValueChange={(value) => setFormFilters((prev) => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_OPTION}>All customers</SelectItem>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={reportQuery.isFetching}>
                  {reportQuery.isFetching ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Apply filters
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters} disabled={reportQuery.isFetching}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{stats.generatedAt ?? '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Low stock products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.lowStockCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recent transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.transactionCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Top customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.topCustomersCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Low stock products</CardTitle>
            <p className="text-sm text-muted-foreground">
              Products that are at or below their reorder level. Schedule supplies to avoid stockouts.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Reorder level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : !report?.lowStockProducts.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No products are currently below their reorder level.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="font-mono text-sm uppercase">{product.sku}</TableCell>
                        <TableCell>{product.stockQuantity}</TableCell>
                        <TableCell>{product.reorderLevel}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <p className="text-sm text-muted-foreground">Combined sales, returns, restocks, and manual adjustments.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : !report?.recentTransactions.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No inventory movements in the selected window.
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.recentTransactions.map((transaction) => (
                        <TableRow key={transaction.transactionId}>
                          <TableCell>{format(new Date(transaction.occurredAtUtc), 'PPpp')}</TableCell>
                          <TableCell>{transaction.productName}</TableCell>
                          <TableCell>
                            <Badge className={transactionBadgeStyles[transaction.type]}>{transactionTypeLabels[transaction.type]}</Badge>
                          </TableCell>
                          <TableCell>{transaction.quantity}</TableCell>
                          <TableCell>${transaction.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top customers</CardTitle>
              <p className="text-sm text-muted-foreground">High value customers ranked by total spend.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Lifetime spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : !report?.topCustomers.length ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No customer orders in the selected window.
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.topCustomers.map((customer) => (
                        <TableRow key={customer.customerId}>
                          <TableCell>{customer.customerName}</TableCell>
                          <TableCell>{customer.ordersCount}</TableCell>
                          <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
