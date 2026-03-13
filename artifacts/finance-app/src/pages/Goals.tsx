import { useState } from "react";
import { 
  Card, CardContent, Typography, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  CircularProgress, LinearProgress
} from "@mui/material";
import { AddRounded, EditRounded, DeleteRounded, FlagRounded } from "@mui/icons-material";
import { useGetGoals, type Goal, type CreateGoalInput } from "@workspace/api-client-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { format } from "date-fns";

export default function Goals() {
  const { data: goals, isLoading } = useGetGoals();
  const { goals: mutations } = useFinanceMutations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeGoalId, setActiveGoalId] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number>(0);

  const [formData, setFormData] = useState<CreateGoalInput>({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
    color: "#6366f1"
  });

  const openDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline || "",
        color: goal.color || "#6366f1"
      });
    } else {
      setEditingGoal(null);
      setFormData({ name: "", targetAmount: 0, currentAmount: 0, deadline: "", color: "#6366f1" });
    }
    setDialogOpen(true);
  };

  const openContribute = (id: number) => {
    setActiveGoalId(id);
    setContributionAmount(0);
    setContributeOpen(true);
  };

  const handleSubmit = () => {
    if (editingGoal) {
      mutations.update.mutate({ id: editingGoal.id, data: formData }, { onSuccess: () => setDialogOpen(false) });
    } else {
      mutations.create.mutate({ data: formData }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleContribute = () => {
    if (activeGoalId && contributionAmount > 0) {
      mutations.contribute.mutate(
        { id: activeGoalId, data: { amount: contributionAmount } }, 
        { onSuccess: () => setContributeOpen(false) }
      );
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Financial Goals</Typography>
          <Typography variant="body1" className="text-muted-foreground">Save up for your future</Typography>
        </div>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => openDialog()}>
          New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals?.length === 0 && (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            <FlagRounded sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6">No goals defined</Typography>
            <Typography variant="body2" className="mb-4">Set a target to start tracking your savings.</Typography>
            <Button variant="outlined" onClick={() => openDialog()}>Create a Goal</Button>
          </div>
        )}

        {goals?.map((goal) => (
          <Card key={goal.id} className="bg-card flex flex-col h-full">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Typography variant="h6" className="font-bold text-white mb-1">{goal.name}</Typography>
                  {goal.deadline && (
                    <Typography variant="body2" className="text-muted-foreground">
                      Target: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                </div>
                <div className="flex">
                  <IconButton size="small" onClick={() => openDialog(goal)} className="text-muted-foreground hover:text-white">
                    <EditRounded fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => { if(confirm("Delete goal?")) mutations.delete.mutate({id: goal.id}) }} className="text-danger hover:bg-danger/10">
                    <DeleteRounded fontSize="small" />
                  </IconButton>
                </div>
              </div>

              <div className="mb-8 flex-1">
                <div className="flex justify-between items-end mb-2">
                  <Typography variant="h3" className="font-bold text-white">
                    ${goal.currentAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="subtitle1" className="text-muted-foreground font-medium mb-1">
                    of ${goal.targetAmount.toLocaleString()}
                  </Typography>
                </div>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, goal.progressPercent)} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      bgcolor: goal.color || '#6366f1',
                    }
                  }} 
                />
                <div className="flex justify-between mt-2">
                  <Typography variant="caption" className="text-primary font-bold">
                    {goal.progressPercent.toFixed(1)}% Complete
                  </Typography>
                  {goal.monthlySuggestion ? (
                    <Typography variant="caption" className="text-muted-foreground">
                      Need ~${goal.monthlySuggestion.toLocaleString()}/mo
                    </Typography>
                  ) : null}
                </div>
              </div>

              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => openContribute(goal.id)}
                sx={{ borderColor: goal.color || '#6366f1', color: goal.color || '#6366f1' }}
              >
                Contribute to Goal
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <TextField
            label="Goal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            className="mt-2"
          />
          <TextField
            label="Target Amount ($)"
            type="number"
            value={formData.targetAmount}
            onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
            fullWidth
          />
          {!editingGoal && (
            <TextField
              label="Starting Amount ($)"
              type="number"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          )}
          <TextField
            label="Deadline (Optional)"
            type="date"
            value={formData.deadline || ""}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Theme Color"
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
            disabled={mutations.create.isPending || mutations.update.isPending || !formData.name || !formData.targetAmount}
          >
            Save Goal
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={contributeOpen} onClose={() => setContributeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Contribution</DialogTitle>
        <DialogContent className="pt-4">
          <TextField
            label="Amount to add ($)"
            type="number"
            value={contributionAmount || ""}
            onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
            fullWidth
            className="mt-2"
            autoFocus
          />
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={() => setContributeOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleContribute} 
            variant="contained" 
            color="success"
            disabled={mutations.contribute.isPending || contributionAmount <= 0}
          >
            Confirm Contribution
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
