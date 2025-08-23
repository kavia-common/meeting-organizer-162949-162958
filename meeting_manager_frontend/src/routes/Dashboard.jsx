import React from 'react';
import { CalendarView } from '../components/calendar';

/**
 * PUBLIC_INTERFACE
 * Minimal placeholder Dashboard route component.
 */
export default function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>
      <p className="text-muted">Overview of meetings and calendar will appear here.</p>
      <div style={{ marginTop: 16 }}>
        <CalendarView initialView="month" enableService={true} />
      </div>
    </section>
  );
}
