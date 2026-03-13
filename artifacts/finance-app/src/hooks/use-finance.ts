import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useContributeToGoal,
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useDeleteRecurringTransaction,
} from "@workspace/api-client-react";

// Wrapper hooks to automatically invalidate queries and show toasts
export function useFinanceMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSuccess = (message: string, queryKeys: string[]) => {
    toast({ title: "Success", description: message });
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    // Global refetch for dashboard sync
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
  };

  const handleError = (error: any) => {
    toast({
      title: "Error",
      description: error?.message || "An unexpected error occurred",
      variant: "destructive",
    });
  };

  // Transactions
  const createTx = useCreateTransaction({
    mutation: {
      onSuccess: () => handleSuccess("Transaction added", ["/api/transactions", "/api/accounts"]),
      onError: handleError,
    }
  });
  const updateTx = useUpdateTransaction({
    mutation: {
      onSuccess: () => handleSuccess("Transaction updated", ["/api/transactions", "/api/accounts"]),
      onError: handleError,
    }
  });
  const deleteTx = useDeleteTransaction({
    mutation: {
      onSuccess: () => handleSuccess("Transaction deleted", ["/api/transactions", "/api/accounts"]),
      onError: handleError,
    }
  });

  // Accounts
  const createAcc = useCreateAccount({
    mutation: {
      onSuccess: () => handleSuccess("Account created", ["/api/accounts"]),
      onError: handleError,
    }
  });
  const updateAcc = useUpdateAccount({
    mutation: {
      onSuccess: () => handleSuccess("Account updated", ["/api/accounts"]),
      onError: handleError,
    }
  });
  const deleteAcc = useDeleteAccount({
    mutation: {
      onSuccess: () => handleSuccess("Account deleted", ["/api/accounts"]),
      onError: handleError,
    }
  });

  // Categories
  const createCat = useCreateCategory({
    mutation: {
      onSuccess: () => handleSuccess("Category created", ["/api/categories"]),
      onError: handleError,
    }
  });
  const updateCat = useUpdateCategory({
    mutation: {
      onSuccess: () => handleSuccess("Category updated", ["/api/categories"]),
      onError: handleError,
    }
  });
  const deleteCat = useDeleteCategory({
    mutation: {
      onSuccess: () => handleSuccess("Category deleted", ["/api/categories"]),
      onError: handleError,
    }
  });

  // Budgets
  const createBgt = useCreateBudget({
    mutation: {
      onSuccess: () => handleSuccess("Budget set", ["/api/budgets"]),
      onError: handleError,
    }
  });
  const updateBgt = useUpdateBudget({
    mutation: {
      onSuccess: () => handleSuccess("Budget updated", ["/api/budgets"]),
      onError: handleError,
    }
  });
  const deleteBgt = useDeleteBudget({
    mutation: {
      onSuccess: () => handleSuccess("Budget removed", ["/api/budgets"]),
      onError: handleError,
    }
  });

  // Goals
  const createGl = useCreateGoal({
    mutation: {
      onSuccess: () => handleSuccess("Goal created", ["/api/goals"]),
      onError: handleError,
    }
  });
  const updateGl = useUpdateGoal({
    mutation: {
      onSuccess: () => handleSuccess("Goal updated", ["/api/goals"]),
      onError: handleError,
    }
  });
  const deleteGl = useDeleteGoal({
    mutation: {
      onSuccess: () => handleSuccess("Goal removed", ["/api/goals"]),
      onError: handleError,
    }
  });
  const contributeGl = useContributeToGoal({
    mutation: {
      onSuccess: () => handleSuccess("Contribution added!", ["/api/goals"]),
      onError: handleError,
    }
  });

  // Recurring
  const createRec = useCreateRecurringTransaction({
    mutation: {
      onSuccess: () => handleSuccess("Recurring transaction created", ["/api/recurring"]),
      onError: handleError,
    }
  });
  const updateRec = useUpdateRecurringTransaction({
    mutation: {
      onSuccess: () => handleSuccess("Recurring transaction updated", ["/api/recurring"]),
      onError: handleError,
    }
  });
  const deleteRec = useDeleteRecurringTransaction({
    mutation: {
      onSuccess: () => handleSuccess("Recurring transaction deleted", ["/api/recurring"]),
      onError: handleError,
    }
  });

  return {
    transactions: { create: createTx, update: updateTx, delete: deleteTx },
    accounts: { create: createAcc, update: updateAcc, delete: deleteAcc },
    categories: { create: createCat, update: updateCat, delete: deleteCat },
    budgets: { create: createBgt, update: updateBgt, delete: deleteBgt },
    goals: { create: createGl, update: updateGl, delete: deleteGl, contribute: contributeGl },
    recurring: { create: createRec, update: updateRec, delete: deleteRec },
  };
}
