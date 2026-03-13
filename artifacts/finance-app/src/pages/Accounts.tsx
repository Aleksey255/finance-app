import { useState } from "react";
import { 
  Card, CardContent, Typography, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from "@mui/material";
import { 
  AddRounded, EditRounded, DeleteRounded, AccountBalanceWalletRounded, 
  CreditCardRounded, SavingsRounded, TrendingUpRounded 
} from "@mui/icons-material";
import { useGetAccounts, type Account, type CreateAccountInput } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  cash: <AccountBalanceWalletRounded />,
  card: <CreditCardRounded />,
  wallet: <AccountBalanceWalletRounded />,
  savings: <SavingsRounded />,
  investment: <TrendingUpRounded />,
};

export default function Accounts() {
  const { data: accounts, isLoading } = useGetAccounts();
  const { accounts: mutations } = useFinanceMutations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [formData, setFormData] = useState<CreateAccountInput>({
    name: "",
    type: "card",
    currency: "USD",
    initialBalance: 0,
    color: "#6366f1"
  });

  const openDialog = (acc?: Account) => {
    if (acc) {
      setEditingAcc(acc);
      setFormData({
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        initialBalance: acc.initialBalance,
        color: acc.color || "#6366f1"
      });
    } else {
      setEditingAcc(null);
      setFormData({ name: "", type: "card", currency: "USD", initialBalance: 0, color: "#6366f1" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingAcc) {
      mutations.update.mutate({ id: editingAcc.id, data: formData }, { onSuccess: () => setDialogOpen(false) });
    } else {
      mutations.create.mutate({ data: formData }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this account? All associated transactions may be affected.")) {
      mutations.delete.mutate({ id });
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Accounts</Typography>
          <Typography variant="body1" className="text-muted-foreground">Manage your wallets, cards, and banks</Typography>
        </div>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => openDialog()}>
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((acc) => (
          <Card key={acc.id} className="bg-card hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.03] rounded-bl-[100px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: acc.color || '#6366f1' }} />
            
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: acc.color || '#6366f1', boxShadow: `0 8px 16px -4px ${acc.color}60` }}
                >
                  {ACCOUNT_ICONS[acc.type] || <AccountBalanceWalletRounded />}
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton size="small" onClick={() => openDialog(acc)} className="text-muted-foreground hover:text-white">
                    <EditRounded fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(acc.id)} className="text-danger hover:bg-danger/10">
                    <DeleteRounded fontSize="small" />
                  </IconButton>
                </div>
              </div>
              
              <Typography variant="body2" className="text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                {acc.name}
              </Typography>
              <Typography variant="h4" className="font-bold text-white mb-1">
                ${acc.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </Typography>
              <Typography variant="body2" className="text-muted-foreground capitalize">
                {acc.type} • {acc.currency}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAcc ? "Edit Account" : "New Account"}</DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <TextField
            label="Account Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            className="mt-2"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="wallet">Wallet</MenuItem>
                <MenuItem value="savings">Savings</MenuItem>
                <MenuItem value="investment">Investment</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              fullWidth
            />
          </div>

          <TextField
            label="Initial Balance"
            type="number"
            value={formData.initialBalance}
            onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
            fullWidth
            disabled={!!editingAcc}
            helperText={editingAcc ? "Initial balance cannot be changed after creation" : ""}
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={mutations.create.isPending || mutations.update.isPending || !formData.name}
          >
            Save Account
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
