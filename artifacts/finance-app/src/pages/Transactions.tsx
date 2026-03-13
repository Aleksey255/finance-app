import { useState } from "react";
import { 
  Card, Typography, Button, IconButton, Chip, 
  Menu, MenuItem, CircularProgress
} from "@mui/material";
import { 
  AddRounded, MoreVertRounded, EditRounded, DeleteRounded, FileDownloadRounded 
} from "@mui/icons-material";
import { useGetTransactions, useExportTransactions, type Transaction } from "@workspace/api-client-react";
import { format } from "date-fns";
import { TransactionDialog } from "@/components/TransactionDialog";
import { useFinanceMutations } from "@/hooks/use-finance";

export default function Transactions() {
  const { data, isLoading } = useGetTransactions({ limit: 100 });
  const { transactions } = useFinanceMutations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedTxId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTxId(null);
  };

  const handleEdit = () => {
    const tx = data?.transactions.find(t => t.id === selectedTxId);
    if (tx) {
      setEditingTx(tx);
      setDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedTxId) {
      if (confirm("Delete this transaction?")) {
        transactions.delete.mutate({ id: selectedTxId });
      }
    }
    handleMenuClose();
  };

  const handleExport = async () => {
    // In a real app, this would trigger the actual file download using the string response
    const csv = await fetch("/api/analytics/export?format=csv").then(res => res.text());
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Transactions</Typography>
          <Typography variant="body1" className="text-muted-foreground">
            Manage your income and expenses
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadRounded />} 
            onClick={handleExport}
            color="inherit"
            className="border-border text-white hover:bg-white/5"
          >
            Export CSV
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddRounded />} 
            onClick={() => { setEditingTx(null); setDialogOpen(true); }}
          >
            Add New
          </Button>
        </div>
      </div>

      <Card className="bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><CircularProgress /></div>
        ) : data?.transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Typography variant="h6">No transactions found</Typography>
            <Typography variant="body2">Click Add New to create one.</Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-border">Date</th>
                  <th className="px-6 py-4 font-semibold border-b border-border">Details</th>
                  <th className="px-6 py-4 font-semibold border-b border-border">Category</th>
                  <th className="px-6 py-4 font-semibold border-b border-border">Account</th>
                  <th className="px-6 py-4 font-semibold border-b border-border text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold border-b border-border w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-white">
                      {format(new Date(tx.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {tx.comment || 'No description'}
                    </td>
                    <td className="px-6 py-4">
                      <Chip 
                        label={tx.category?.name || "Unknown"} 
                        size="small" 
                        sx={{ 
                          bgcolor: tx.category?.color ? `${tx.category.color}20` : 'rgba(255,255,255,0.1)', 
                          color: tx.category?.color || '#fff',
                          fontWeight: 600
                        }} 
                      />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {tx.account?.name || "Unknown"}
                    </td>
                    <td className={`px-6 py-4 font-bold text-right ${tx.type === 'income' ? 'text-success' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <IconButton 
                        size="small" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white"
                        onClick={(e) => handleMenuClick(e, tx.id)}
                      >
                        <MoreVertRounded fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            border: '1px solid #2d3248',
            bgcolor: '#1a1d2e',
            color: '#fff',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
            }
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>
          <EditRounded fontSize="small" className="mr-2 text-muted-foreground" /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} className="text-danger hover:text-danger hover:bg-danger/10">
          <DeleteRounded fontSize="small" className="mr-2 text-danger" /> Delete
        </MenuItem>
      </Menu>

      <TransactionDialog 
        open={dialogOpen} 
        onClose={() => { setDialogOpen(false); setEditingTx(null); }} 
        initialData={editingTx}
      />
    </div>
  );
}
