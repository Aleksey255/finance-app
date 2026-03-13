import { useState, useEffect } from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, Select, InputLabel, FormControl, CircularProgress
} from "@mui/material";
import { useFinanceMutations } from "@/hooks/use-finance";
import { useGetAccounts, useGetCategories } from "@workspace/api-client-react";
import type { Transaction, CreateTransactionInput } from "@workspace/api-client-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

export function TransactionDialog({ open, onClose, initialData }: Props) {
  const { transactions } = useFinanceMutations();
  const { data: accounts } = useGetAccounts();
  const { data: categories } = useGetCategories();
  
  const [formData, setFormData] = useState<CreateTransactionInput>({
    type: "expense",
    amount: 0,
    accountId: 0,
    categoryId: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    comment: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        amount: initialData.amount,
        accountId: initialData.accountId,
        categoryId: initialData.categoryId,
        date: initialData.date,
        comment: initialData.comment || "",
      });
    } else {
      setFormData({
        type: "expense",
        amount: 0,
        accountId: accounts?.[0]?.id || 0,
        categoryId: categories?.[0]?.id || 0,
        date: format(new Date(), "yyyy-MM-dd"),
        comment: "",
      });
    }
  }, [initialData, open, accounts, categories]);

  const handleSubmit = () => {
    if (initialData) {
      transactions.update.mutate({ id: initialData.id, data: formData }, { onSuccess: onClose });
    } else {
      transactions.create.mutate({ data: formData }, { onSuccess: onClose });
    }
  };

  const isPending = transactions.create.isPending || transactions.update.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? "Edit Transaction" : "New Transaction"}</DialogTitle>
      <DialogContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            fullWidth
          />
        </div>

        <FormControl fullWidth>
          <InputLabel>Account</InputLabel>
          <Select
            value={formData.accountId || ""}
            label="Account"
            onChange={(e) => setFormData({ ...formData, accountId: Number(e.target.value) })}
          >
            {accounts?.map((acc) => (
              <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.categoryId || ""}
            label="Category"
            onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
          >
            {categories?.filter(c => c.type === formData.type || c.type === "both").map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          fullWidth
        />

        <TextField
          label="Comment / Note"
          multiline
          rows={2}
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          fullWidth
        />
      </DialogContent>
      <DialogActions className="p-4">
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={isPending || !formData.accountId || !formData.categoryId || !formData.amount}
          color={formData.type === "income" ? "success" : "primary"}
        >
          {isPending ? <CircularProgress size={24} color="inherit" /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
