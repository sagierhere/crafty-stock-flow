import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Inventory = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Inventory tracking and supply management coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Inventory;
