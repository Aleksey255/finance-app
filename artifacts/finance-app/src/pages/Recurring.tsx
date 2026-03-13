import { Typography, Card, CircularProgress } from "@mui/material";
import { useGetRecurringTransactions } from "@workspace/api-client-react";

export default function Recurring() {
  const { data, isLoading } = useGetRecurringTransactions();

  if (isLoading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Recurring Bills</Typography>
          <Typography variant="body1" className="text-muted-foreground">Manage subscriptions and regular payments</Typography>
        </div>
      </div>

      <Card className="bg-card overflow-hidden">
        {data?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Typography variant="h6">No recurring transactions found</Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-border">Description</th>
                  <th className="px-6 py-4 font-semibold border-b border-border">Frequency</th>
                  <th className="px-6 py-4 font-semibold border-b border-border">Next Date</th>
                  <th className="px-6 py-4 font-semibold border-b border-border text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{tx.description}</td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">{tx.frequency}</td>
                    <td className="px-6 py-4 text-white">{tx.nextDate || 'N/A'}</td>
                    <td className={`px-6 py-4 font-bold text-right ${tx.type === 'income' ? 'text-success' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
