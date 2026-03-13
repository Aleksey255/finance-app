import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, AppBar, Toolbar, Typography, Fab, useMediaQuery, useTheme
} from "@mui/material";
import {
  DashboardRounded, AccountBalanceWalletRounded, ReceiptLongRounded,
  CategoryRounded, PieChartRounded, TrackChangesRounded,
  EventRepeatRounded, CalendarMonthRounded, MenuRounded, AddRounded
} from "@mui/icons-material";
import { TransactionDialog } from "./TransactionDialog";

const DRAWER_WIDTH = 280;

const MENU_ITEMS = [
  { text: "Dashboard", path: "/", icon: <DashboardRounded /> },
  { text: "Transactions", path: "/transactions", icon: <ReceiptLongRounded /> },
  { text: "Accounts", path: "/accounts", icon: <AccountBalanceWalletRounded /> },
  { text: "Categories", path: "/categories", icon: <CategoryRounded /> },
  { text: "Budgets", path: "/budgets", icon: <PieChartRounded /> },
  { text: "Goals", path: "/goals", icon: <TrackChangesRounded /> },
  { text: "Recurring", path: "/recurring", icon: <EventRepeatRounded /> },
  { text: "Analytics", path: "/analytics", icon: <PieChartRounded /> },
  { text: "Calendar", path: "/calendar", icon: <CalendarMonthRounded /> },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <AccountBalanceWalletRounded className="text-white text-xl" />
        </div>
        <Typography variant="h6" className="font-bold tracking-tight text-white">
          FinDash
        </Typography>
      </div>
      <List className="px-3 flex-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const active = location === item.path;
          return (
            <Link key={item.text} href={item.path} className="block mb-1">
              <ListItem disablePadding>
                <ListItemButton
                  selected={active}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={`rounded-xl transition-all duration-200 ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <ListItemIcon className={`min-w-0 mr-3 ${active ? "text-primary" : "text-inherit"}`}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontWeight: active ? 600 : 500, fontSize: '0.95rem' }} 
                  />
                </ListItemButton>
              </ListItem>
            </Link>
          );
        })}
      </List>
      
      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 p-4 rounded-xl border border-indigo-500/20">
          <Typography variant="subtitle2" className="font-bold text-white mb-1">Premium Plan</Typography>
          <Typography variant="body2" className="text-indigo-200 mb-3 text-xs">Unlock advanced analytics and infinite goals.</Typography>
          <button className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-semibold transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar position="fixed" className="bg-card border-b border-border shadow-none" elevation={0}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} className="mr-2">
              <MenuRounded />
            </IconButton>
            <Typography variant="h6" className="font-bold text-white">FinDash</Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH, borderRight: "none", background: "transparent" },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col w-full ${isMobile ? "pt-16" : ""}`}>
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Global FAB */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setTxDialogOpen(true)}
        sx={{ position: "fixed", bottom: 24, right: 24, boxShadow: "0 8px 24px -4px rgba(99, 102, 241, 0.5)" }}
      >
        <AddRounded />
      </Fab>

      <TransactionDialog open={txDialogOpen} onClose={() => setTxDialogOpen(false)} />
    </div>
  );
}
