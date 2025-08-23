import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Minimal placeholder Meeting Details route component.
 */
export default function MeetingDetails() {
  const { id } = useParams();

  return (
    <section>
      <h1>Meeting Details</h1>
      <p>Viewing meeting with ID: <strong>{id}</strong></p>
    </section>
  );
}
