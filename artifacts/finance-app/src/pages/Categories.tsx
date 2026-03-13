import { useState } from "react";
import { 
  Card, Typography, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Chip
} from "@mui/material";
import { 
  AddRounded, EditRounded, DeleteRounded, CircleRounded
} from "@mui/icons-material";
import { useGetCategories, type Category, type CreateCategoryInput } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";

export default function Categories() {
  const { data: categories, isLoading } = useGetCategories();
  const { categories: mutations } = useFinanceMutations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: "",
    type: "expense",
    color: "#6366f1",
    icon: "category"
  });

  const openDialog = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon
      });
    } else {
      setEditingCat(null);
      setFormData({ name: "", type: "expense", color: "#6366f1", icon: "category" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingCat) {
      mutations.update.mutate({ id: editingCat.id, data: formData }, { onSuccess: () => setDialogOpen(false) });
    } else {
      mutations.create.mutate({ data: formData }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this category?")) {
      mutations.delete.mutate({ id });
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Categories</Typography>
          <Typography variant="body1" className="text-muted-foreground">Manage transaction categorization</Typography>
        </div>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => openDialog()}>
          Add Category
        </Button>
      </div>

      <Card className="bg-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-1 bg-border/50">
          {categories?.map((cat) => (
            <div key={cat.id} className="bg-card p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center opacity-90"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <CircleRounded fontSize="small" />
                </div>
                <div>
                  <Typography variant="subtitle1" className="font-bold text-white leading-tight">
                    {cat.name}
                  </Typography>
                  <Typography variant="caption" className="text-muted-foreground capitalize">
                    {cat.type}
                  </Typography>
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {!cat.isDefault && (
                  <>
                    <IconButton size="small" onClick={() => openDialog(cat)}>
                      <EditRounded fontSize="small" className="text-muted-foreground hover:text-white" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(cat.id)}>
                      <DeleteRounded fontSize="small" className="text-danger hover:text-danger" />
                    </IconButton>
                  </>
                )}
                {cat.isDefault && (
                  <Chip size="small" label="Default" variant="outlined" sx={{ borderColor: '#2d3248', color: '#94a3b8' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <TextField
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            className="mt-2"
          />
          
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Color (Hex)"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            fullWidth
            sx={{ '& input': { height: 40, cursor: 'pointer', padding: '4px' } }}
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={mutations.create.isPending || mutations.update.isPending || !formData.name}
          >
            Save Category
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
