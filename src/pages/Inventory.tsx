import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inventoryService, SupplyRecord } from '@/services/inventory';
import { suppliersService } from '@/services/suppliers';
import { productsService, Product } from '@/services/products';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus, RefreshCw } from 'lucide-react';

interface SupplyFormState {
  supplierId: string;
  quantityReceived: number;
  referenceNumber: string;
  notes: string;
}

const Inventory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: productsService.getAll,
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: suppliersService.getAll,
  });

  const [selectedProductId, setSelectedProductId] = useState<string>('');

  useEffect(() => {
    if (!selectedProductId && products?.length) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const selectedProduct = useMemo(
    () => products?.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  const { data: history, isLoading: historyLoading, refetch: refetchHistory, isFetching: historyFetching } = useQuery({
    queryKey: ['inventory', 'history', selectedProductId],
    queryFn: () => inventoryService.getHistory(selectedProductId),
    enabled: Boolean(selectedProductId),
  });

  const [formState, setFormState] = useState<SupplyFormState>({
    supplierId: '',
    quantityReceived: 1,
    referenceNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (!formState.supplierId && suppliers?.length) {
      setFormState((prev) => ({ ...prev, supplierId: suppliers[0].id }));
    }
  }, [suppliers, formState.supplierId]);

  const supplyMutation = useMutation({
    mutationFn: inventoryService.recordSupply,
    onSuccess: (record: SupplyRecord) => {
      toast({
        title: 'Supply recorded',
        description: `${record.quantityReceived} units of ${record.productName} added to inventory.`,
      });
      setFormState((prev) => ({ ...prev, quantityReceived: 1, referenceNumber: '', notes: '' }));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'history', record.productId] });
      refetchHistory();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to record supply.';
      toast({ title: 'Supply failed', description: message, variant: 'destructive' });
    },
  });

  const handleRecordSupply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct) {
      toast({ title: 'Select a product first', variant: 'destructive' });
      return;
    }

    if (!formState.supplierId) {
      toast({ title: 'Choose a supplier to continue', variant: 'destructive' });
      return;
    }

    if (formState.quantityReceived <= 0) {
      toast({ title: 'Quantity must be greater than zero', variant: 'destructive' });
      return;
    }

    supplyMutation.mutate({
      supplierId: formState.supplierId,
      productId: selectedProduct.id,
      quantityReceived: formState.quantityReceived,
      referenceNumber: formState.referenceNumber.trim() || undefined,
      notes: formState.notes.trim() || undefined,
    });
  };

  const belowReorder = selectedProduct ? selectedProduct.stockQuantity <= selectedProduct.reorderLevel : false;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Inventory management</h1>
          <p className="text-muted-foreground">
            Monitor stock levels, review supply history, and capture new restocks.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Select product</CardTitle>
              <p className="text-sm text-muted-foreground">Choose a product to inspect current stock and history.</p>
            </div>
            <div className="min-w-[240px]">
              <Label className="sr-only">Product</Label>
              <Select
                value={selectedProductId}
                onValueChange={(value) => setSelectedProductId(value)}
                disabled={productsLoading || !products?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productsLoading ? 'Loading products...' : 'Select product'} />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} • Stock {product.stockQuantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-muted-foreground/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <PackagePlus className="h-4 w-4" /> SKU
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-sm uppercase">{selectedProduct.sku}</p>
                  </CardContent>
                </Card>
                <Card className={belowReorder ? 'border-destructive/60' : 'border-muted-foreground/30'}>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Current stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{selectedProduct.stockQuantity}</p>
                    <p className="text-xs text-muted-foreground">Reorder level {selectedProduct.reorderLevel}</p>
                    {belowReorder && <p className="text-xs font-semibold text-destructive">Below reorder threshold</p>}
                  </CardContent>
                </Card>
                <Card className="border-muted-foreground/30">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Unit price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${selectedProduct.unitPrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Updated automatically for orders</p>
                  </CardContent>
                </Card>
                <Card className="border-muted-foreground/30">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-emerald-600">{selectedProduct.isActive ? 'Active' : 'Inactive'}</p>
                    <p className="text-xs text-muted-foreground">Only active products are available to cashiers</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-muted-foreground">Add a product to get started with inventory tracking.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <Card>
            <CardHeader>
              <CardTitle>Record new supply</CardTitle>
              <p className="text-sm text-muted-foreground">Increase stock levels by logging deliveries from suppliers.</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleRecordSupply}>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select
                    value={formState.supplierId}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, supplierId: value }))}
                    disabled={suppliersLoading || !suppliers?.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={suppliersLoading ? 'Loading suppliers...' : 'Select supplier'} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!suppliersLoading && suppliers?.length === 0 && (
                    <p className="text-xs text-destructive">Add suppliers before recording inventory supplies.</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity received</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={formState.quantityReceived}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          quantityReceived: Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference number</Label>
                    <Input
                      id="reference"
                      value={formState.referenceNumber}
                      onChange={(event) => setFormState((prev) => ({ ...prev, referenceNumber: event.target.value }))}
                      placeholder="Optional PO or invoice reference"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formState.notes}
                    onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Any extra details about this delivery"
                    rows={4}
                  />
                </div>

                <CardFooter className="flex justify-end gap-2 p-0">
                  <Button
                    type="submit"
                    disabled={!selectedProduct || !suppliers?.length || supplyMutation.isPending}
                  >
                    {supplyMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" /> Saving
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <PackagePlus className="h-4 w-4" /> Record supply
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>Supply history</CardTitle>
              <p className="text-sm text-muted-foreground">Most recent deliveries for the selected product.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading || historyFetching ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">Loading history...</TableCell>
                      </TableRow>
                    ) : !history?.length ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No supply records for this product yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.receivedDateUtc), 'PPpp')}</TableCell>
                          <TableCell>{record.supplierName}</TableCell>
                          <TableCell>{record.quantityReceived}</TableCell>
                          <TableCell>{record.referenceNumber || '—'}</TableCell>
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

export default Inventory;
