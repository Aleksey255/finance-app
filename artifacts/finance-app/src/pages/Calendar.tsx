import { useState } from "react";
import { Typography, Card, CircularProgress, Button } from "@mui/material";
import { ChevronLeftRounded, ChevronRightRounded } from "@mui/icons-material";
import { useGetCalendarEvents } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from "date-fns";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data, isLoading } = useGetCalendarEvents({ 
    year: currentDate.getFullYear(), 
    month: currentDate.getMonth() + 1 
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });
  const startOffset = getDay(start); // 0 = Sunday

  if (isLoading) return <div className="flex justify-center p-12"><CircularProgress /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-white mb-1">Financial Calendar</Typography>
          <Typography variant="body1" className="text-muted-foreground">View upcoming bills and past transactions</Typography>
        </div>
        <div className="flex items-center bg-card rounded-xl border border-border p-1">
          <Button onClick={prevMonth} sx={{minWidth: 40}}><ChevronLeftRounded /></Button>
          <Typography variant="button" className="px-4 min-w-[150px] text-center font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <Button onClick={nextMonth} sx={{minWidth: 40}}><ChevronRightRounded /></Button>
        </div>
      </div>

      <Card className="bg-card p-6">
        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Typography key={d} variant="subtitle2" className="text-muted-foreground font-bold">{d}</Typography>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 md:h-32 rounded-xl bg-background/50 border border-border/50 opacity-50" />
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = data?.find(d => d.date === dateStr)?.events || [];
            
            return (
              <div key={dateStr} className="h-24 md:h-32 rounded-xl bg-background border border-border p-2 overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
                <Typography variant="caption" className="text-muted-foreground font-bold block mb-1">
                  {format(day, 'd')}
                </Typography>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {dayEvents.map((evt, i) => (
                    <div key={i} className={`text-xs px-1.5 py-1 rounded font-medium truncate ${evt.transactionType === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                      {evt.transactionType === 'income' ? '+' : '-'}${evt.amount} {evt.description}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
