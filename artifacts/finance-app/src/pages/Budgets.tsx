import { useState } from "react";
import { 
  Card, CardContent, Typography, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  LinearProgress
} from "@mui/material";
import { AddRounded, EditRounded, DeleteRounded, ChevronLeftRounded, ChevronRightRounded } from "@mui/icons-material";
import { useGetBudgets, useGetCategories, type BudgetWithSpending, type CreateBudgetInput } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";

export default function Budgets() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  
  const { data: budgets, isLoading } = useGetBudgets({ year, month });
  const { data: categories } = useGetCategories();
  const { budgets: mutations } = useFinanceMutations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  const [formData, setFormData] = useState<CreateBudgetInput>({
    categoryId: 0,
    amount: 0,
    year,
    month
  });

  const openDialog = (bgt?: BudgetWithSpending) => {
    if (bgt) {
      setEditingBudget(bgt);
      setFormData({
        categoryId: bgt.categoryId,
        amount: bgt.amount,
        year: bgt.year,
        month: bgt.month
      });
    } else {
      setEditingBudget(null);
      setFormData({ categoryId: categories?.[0]?.id || 0, amount: 0, year, month });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingBudget) {
      mutations.update.mutate({ id: editingBudget.id, data: formData }, { onSuccess: () => setDialogOpen(false) });
    } else {
      mutations.create.mutate({ data: formData }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  if (isLoading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Budgets</Typography>
          <Typography variant="body1" className="text-muted-foreground">Track spending limits</Typography>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-card rounded-xl border border-border p-1">
            <IconButton onClick={prevMonth} size="small"><ChevronLeftRounded /></IconButton>
            <Typography variant="button" className="px-4 min-w-[120px] text-center font-bold">
              {monthName} {year}
            </Typography>
            <IconButton onClick={nextMonth} size="small"><ChevronRightRounded /></IconButton>
          </div>
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => openDialog()}>
            Set Budget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgets?.length === 0 && (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            <Typography variant="h6">No budgets set for this month</Typography>
            <Typography variant="body2" className="mb-4">Create budgets to track your category spending</Typography>
            <Button variant="outlined" onClick={() => openDialog()}>Create First Budget</Button>
          </div>
        )}

        {budgets?.map((bgt) => {
          const percent = Math.min(100, Math.round((bgt.spent / bgt.amount) * 100));
          const isWarning = percent > 85;
          const isDanger = percent >= 100;
          
          return (
            <Card key={bgt.id} className="bg-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${bgt.category?.color}20` }}>
                      <span className="text-xl font-bold" style={{ color: bgt.category?.color }}>{bgt.category?.name.charAt(0)}</span>
                    </div>
                    <div>
                      <Typography variant="h6" className="font-bold text-white">{bgt.category?.name}</Typography>
                      <Typography variant="body2" className="text-muted-foreground">
                        {percent}% used
                      </Typography>
                    </div>
                  </div>
                  <div className="flex">
                    <IconButton size="small" onClick={() => openDialog(bgt)} className="text-muted-foreground hover:text-white">
                      <EditRounded fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => mutations.delete.mutate({id: bgt.id})} className="text-danger hover:bg-danger/10">
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  </div>
                </div>

                <div className="mb-2 flex justify-between items-end">
                  <Typography variant="h4" className="font-bold text-white">
                    ${bgt.spent.toLocaleString()} <span className="text-lg text-muted-foreground font-medium">/ ${bgt.amount.toLocaleString()}</span>
                  </Typography>
                  <Typography variant="caption" className={isDanger ? "text-danger font-bold" : "text-muted-foreground"}>
                    ${Math.max(0, bgt.amount - bgt.spent).toLocaleString()} left
                  </Typography>
                </div>

                <LinearProgress 
                  variant="determinate" 
                  value={percent} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e',
                    }
                  }} 
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingBudget ? "Edit Budget" : "Set Category Budget"}</DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <FormControl fullWidth className="mt-2">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.categoryId || ""}
              label="Category"
              onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
              disabled={!!editingBudget}
            >
              {categories?.filter(c => c.type === 'expense' || c.type === 'both').map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Monthly Limit ($)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            fullWidth
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={mutations.create.isPending || mutations.update.isPending || !formData.categoryId || !formData.amount}
          >
            Save Budget
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
