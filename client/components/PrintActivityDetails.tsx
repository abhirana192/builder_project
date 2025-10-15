import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, MapPin, Printer, User, CalendarDays, Mountain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityInstance {
  id: number;
  activity_id: number;
  activity_name: string;
  booking_reference: string;
  scheduled_date: string;
  scheduled_time: string;
  guide_name?: string;
  guide_id?: number;
  status: string;
  weather_conditions?: string;
  attendance_count: number;
  max_participants: number;
  notes?: string;
  location?: string;
}

interface PrintActivityDetailsProps {
  activities: ActivityInstance[];
  children: React.ReactNode;
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString();
const fmtDateTime = (date: string, time: string) => `${fmtDate(date)} ${time}`;
const titleCase = (s: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const PrintActivityDetails: React.FC<PrintActivityDetailsProps> = ({ activities, children }) => {
  const { toast } = useToast();

  const totals = activities.reduce(
    (acc, a) => {
      acc.attending += Number(a.attendance_count || 0);
      acc.capacity += Number(a.max_participants || 0);
      acc.byDate.add(a.scheduled_date);
      return acc;
    },
    { attending: 0, capacity: 0, byDate: new Set<string>() }
  );

  const dateLabel = (() => {
    const unique = Array.from(totals.byDate);
    if (unique.length === 0) return new Date().toLocaleDateString();
    if (unique.length === 1) return fmtDate(unique[0]);
    const sorted = unique.sort((a,b)=> new Date(a).getTime()-new Date(b).getTime());
    return `${fmtDate(sorted[0])} - ${fmtDate(sorted[sorted.length-1])}`;
  })();

  const statusClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'status status-completed';
    if (s === 'in_progress') return 'status status-in_progress';
    if (s === 'cancelled') return 'status status-cancelled';
    return 'status status-scheduled';
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast({ title: 'Print Failed', description: 'Please allow pop-ups to print the schedule', variant: 'destructive' });
      return;
    }

    const now = new Date();
    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Activity Schedule — ${dateLabel}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    :root { --ink:#111827; --muted:#6b7280; --line:#e5e7eb; --brand:#111827; --pill:#111827; }
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; color: var(--ink); }
    .header { display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid var(--ink); padding-bottom:8px; margin-bottom:14px; }
    .title { font-size: 22px; font-weight: 800; letter-spacing: .2px; }
    .sub { color: var(--muted); font-size: 12px; }
    .chips { display:flex; gap:8px; margin-top:6px; flex-wrap:wrap; }
    .chip { border:1px solid var(--line); padding:4px 8px; border-radius:999px; font-size:11px; }

    .activity { page-break-inside: avoid; border:1px solid var(--line); border-radius:8px; padding:12px; margin:10px 0; }
    .activity-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .activity-name { font-weight:700; font-size:16px; }
    .pill { font-size:11px; padding:4px 8px; border-radius:999px; border:1px solid var(--line); }
    .status { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; border:1px solid var(--line); }
    .status-scheduled { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
    .status-in_progress { background:#fff7ed; color:#c2410c; border-color:#fed7aa; }
    .status-completed { background:#ecfdf5; color:#047857; border-color:#a7f3d0; }
    .status-cancelled { background:#fef2f2; color:#b91c1c; border-color:#fecaca; }

    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:8px 16px; }
    .row { display:flex; gap:6px; font-size:12px; }
    .label { color: var(--muted); min-width:80px; }

    .section { margin-top:10px; padding-top:8px; border-top:1px dashed var(--line); }
    .signature { height:24px; border-bottom:1px solid #9ca3af; }

    .footer { margin-top:18px; border-top:2px solid var(--ink); padding-top:8px; text-align:center; color:var(--muted); font-size:11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">JIGUANG TOUR — Activity Schedule</div>
      <div class="sub">Date: ${dateLabel}</div>
      <div class="chips">
        <span class="chip">Activities: ${activities.length}</span>
        <span class="chip">Attending: ${totals.attending}</span>
        <span class="chip">Capacity: ${totals.capacity}</span>
      </div>
    </div>
    <div class="sub">Printed: ${now.toLocaleString()}</div>
  </div>

  ${activities
    .map((a) => `
      <div class="activity">
        <div class="activity-head">
          <div class="activity-name">${a.activity_name}</div>
          <div class="${statusClass(a.status)}">${titleCase(a.status)}</div>
        </div>
        <div class="grid">
          <div class="row"><div class="label">Time</div><div>${fmtDateTime(a.scheduled_date, a.scheduled_time)}</div></div>
          <div class="row"><div class="label">Guide</div><div>${a.guide_name || '—'}</div></div>
          <div class="row"><div class="label">Location</div><div>${a.location || '—'}</div></div>
          <div class="row"><div class="label">Participants</div><div>${a.attendance_count} / ${a.max_participants}</div></div>
          ${a.booking_reference ? `<div class="row"><div class="label">Booking Ref</div><div>${a.booking_reference}</div></div>` : ''}
          ${a.weather_conditions ? `<div class="row"><div class="label">Weather</div><div>${a.weather_conditions}</div></div>` : ''}
        </div>
        ${a.notes ? `<div class="section"><div class="label" style="display:block;margin-bottom:4px;">Notes</div><div style="font-size:12px;">${a.notes}</div></div>` : ''}
        <div class="section">
          <div class="label" style="display:block;margin-bottom:6px;">Guide Signature</div>
          <div class="signature"></div>
        </div>
      </div>
    `)
    .join('')}

  <div class="footer">
    Manager Signature: _________________________ Time: _________
  </div>
</body>
</html>`;

    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.close();

    toast({ title: 'Print Ready', description: 'Schedule sent to printer' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-foreground" />
                <span className="font-semibold">Activity Schedule</span>
              </div>
              <div className="text-xs text-muted-foreground">{dateLabel}</div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </DialogTitle>
          <DialogDescription>
            Overview for guides and staff. Includes timing, capacity, and signatures.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-md border px-3 py-2 text-sm"><span className="text-muted-foreground">Activities:</span> {activities.length}</div>
          <div className="rounded-md border px-3 py-2 text-sm"><span className="text-muted-foreground">Attending:</span> {totals.attending}</div>
          <div className="rounded-md border px-3 py-2 text-sm"><span className="text-muted-foreground">Capacity:</span> {totals.capacity}</div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Calendar className="mx-auto h-14 w-14 mb-3 opacity-50" />
            <p>No activities match the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((a) => (
              <Card key={a.id} className="border-l-4 border-l-foreground/70">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mountain className="h-5 w-5" />
                      {a.activity_name}
                    </div>
                    <Badge variant="outline">{titleCase(a.status)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Time:</span><span>{fmtDateTime(a.scheduled_date, a.scheduled_time)}</span></div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Guide:</span><span>{a.guide_name || 'N/A'}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Location:</span><span>{a.location || '—'}</span></div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Participants:</span><span>{a.attendance_count} / {a.max_participants}</span></div>
                    {a.booking_reference && (
                      <div className="flex items-center gap-2"><span className="font-medium">Booking Ref:</span><span>{a.booking_reference}</span></div>
                    )}
                    {a.weather_conditions && (
                      <div className="flex items-center gap-2"><span className="font-medium">Weather:</span><span>{a.weather_conditions}</span></div>
                    )}
                  </div>

                  {a.notes && (
                    <div className="pt-2 border-t text-sm">
                      <div className="font-medium mb-1">Notes</div>
                      <div className="text-muted-foreground">{a.notes}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Tour Guide Signature</div>
                    <div className="h-7 border-b" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PrintActivityDetails;
