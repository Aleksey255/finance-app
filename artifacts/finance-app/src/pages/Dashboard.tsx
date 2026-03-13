import { 
  Card, CardContent, Typography, Grid, CircularProgress, Button 
} from "@mui/material";
import { 
  AccountBalanceWalletRounded, TrendingUpRounded, TrendingDownRounded, 
  SavingsRounded 
} from "@mui/icons-material";
import { useGetAnalyticsSummary, useGetMonthlyTrend } from "@workspace/api-client-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { format } from "date-fns";

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316"];

export default function Dashboard() {
  const date = new Date();
  const { data: summary, isLoading: loadingSummary } = useGetAnalyticsSummary({
    year: date.getFullYear(),
    month: date.getMonth() + 1
  });
  const { data: trends, isLoading: loadingTrends } = useGetMonthlyTrend({ months: 6 });

  if (loadingSummary || loadingTrends) {
    return <div className="flex h-full items-center justify-center"><CircularProgress /></div>;
  }

  const pieData = summary?.topExpenseCategories?.map(c => ({
    name: c.categoryName,
    value: c.total
  })) || [];

  const trendData = trends?.map(t => ({
    name: `${t.month}/${t.year.toString().slice(2)}`,
    Income: t.income,
    Expense: t.expense
  })).reverse() || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Overview</Typography>
          <Typography variant="body1" className="text-muted-foreground">
            {format(date, 'MMMM yyyy')} Financial Summary
          </Typography>
        </div>
      </div>

      <Grid container spacing={3}>
        {/* Total Balance */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl shadow-indigo-900/20">
            <CardContent>
              <div className="flex items-center justify-between opacity-80 mb-4">
                <Typography variant="subtitle2" className="font-medium uppercase tracking-wider">Total Balance</Typography>
                <AccountBalanceWalletRounded />
              </div>
              <Typography variant="h3" className="font-bold tracking-tight">
                ${summary?.totalBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Income */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-card">
            <CardContent>
              <div className="flex items-center justify-between text-muted-foreground mb-4">
                <Typography variant="subtitle2" className="font-medium uppercase tracking-wider">Monthly Income</Typography>
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <TrendingUpRounded fontSize="small" />
                </div>
              </div>
              <Typography variant="h4" className="font-bold text-white">
                ${summary?.monthIncome?.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Expense */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-card">
            <CardContent>
              <div className="flex items-center justify-between text-muted-foreground mb-4">
                <Typography variant="subtitle2" className="font-medium uppercase tracking-wider">Monthly Expense</Typography>
                <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                  <TrendingDownRounded fontSize="small" />
                </div>
              </div>
              <Typography variant="h4" className="font-bold text-white">
                ${summary?.monthExpense?.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Net */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="bg-card">
            <CardContent>
              <div className="flex items-center justify-between text-muted-foreground mb-4">
                <Typography variant="subtitle2" className="font-medium uppercase tracking-wider">Net Savings</Typography>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <SavingsRounded fontSize="small" />
                </div>
              </div>
              <Typography variant="h4" className="font-bold text-white">
                ${summary?.monthNet?.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card className="h-[400px] flex flex-col">
            <CardContent className="flex-1 pb-0">
              <Typography variant="h6" className="font-bold mb-6">Income vs Expense (6 Months)</Typography>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#2d3248'}} contentStyle={{backgroundColor: '#1a1d2e', border: '1px solid #2d3248', borderRadius: '8px'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="h-[400px] flex flex-col">
            <CardContent className="flex-1">
              <Typography variant="h6" className="font-bold mb-2">Top Expenses</Typography>
              <Typography variant="body2" className="text-muted-foreground mb-4">By category this month</Typography>
              <div className="h-[280px] w-full">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#1a1d2e', border: 'none', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No expense data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
