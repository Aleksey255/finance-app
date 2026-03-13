import { Typography, Card, CardContent, CircularProgress } from "@mui/material";
import { useGetAnalyticsSummary, useGetAnalyticsByCategory } from "@workspace/api-client-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Analytics() {
  const date = new Date();
  const { data: summary, isLoading: load1 } = useGetAnalyticsSummary({ year: date.getFullYear(), month: date.getMonth() + 1 });
  const { data: byCategory, isLoading: load2 } = useGetAnalyticsByCategory({ type: 'expense' });

  if (load1 || load2) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Analytics Deep Dive</Typography>
          <Typography variant="body1" className="text-muted-foreground">Detailed financial breakdown</Typography>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-bold mb-6">Expense Breakdown by Category</Typography>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="categoryName" type="category" tick={{fill: '#fff'}} axisLine={false} tickLine={false} width={150} />
                <Tooltip cursor={{fill: '#2d3248'}} contentStyle={{backgroundColor: '#1a1d2e', border: '1px solid #2d3248', borderRadius: '8px'}} />
                <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card p-6 flex items-center justify-between">
            <Typography variant="subtitle1" className="text-muted-foreground">Total Processed Volume</Typography>
            <Typography variant="h4" className="font-bold">${((summary?.monthIncome || 0) + (summary?.monthExpense || 0)).toLocaleString()}</Typography>
        </Card>
        <Card className="bg-card p-6 flex items-center justify-between">
            <Typography variant="subtitle1" className="text-muted-foreground">Savings Rate</Typography>
            <Typography variant="h4" className="font-bold text-success">
                {summary?.monthIncome ? Math.max(0, Math.round(((summary.monthNet || 0) / summary.monthIncome) * 100)) : 0}%
            </Typography>
        </Card>
      </div>
    </div>
  );
}
