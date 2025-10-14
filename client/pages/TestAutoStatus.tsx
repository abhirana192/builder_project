import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestAutoStatus() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAutoStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/groups/test-auto-status', { method: 'POST' });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing auto-status:', error);
      setResult({ error: 'Failed to test auto-status' });
    } finally {
      setLoading(false);
    }
  };

  const checkGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      setResult({ groups: data });
    } catch (error) {
      console.error('Error fetching groups:', error);
      setResult({ error: 'Failed to fetch groups' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Auto-Status Test</h1>
        <p className="text-muted-foreground">Test automatic status updates for completed tours</p>
      </div>

      <div className="flex gap-4">
        <Button onClick={testAutoStatus} disabled={loading}>
          Create Test Group & Check Status
        </Button>
        <Button onClick={checkGroups} disabled={loading} variant="outline">
          Check Current Groups
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
