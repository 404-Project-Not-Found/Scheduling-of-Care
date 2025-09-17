'use client';

import React, { useState } from 'react';

export default function RequestChangeFormPage() {
  const [taskName, setTaskName] = useState('');
  const [details, setDetails] = useState('');
  const [reason, setReason] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = () => {
    if (!taskName || !details || !reason) {
      setSubmitMessage('Please fill in all fields before submitting.');
      return;
    }

    console.log({
      taskName,
      details,
      reason,
    });

    setSubmitMessage('Request submitted successfully!');
    setTaskName('');
    setDetails('');
    setReason('');
  };

  const handleCancel = () => {
    setTaskName('');
    setDetails('');
    setReason('');
    setSubmitMessage('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ backgroundColor: '#ffd9b3' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-3xl border rounded-lg shadow-lg relative"
        style={{ backgroundColor: '#fff4e6', minHeight: '600px' }}
      >
        {/* Header */}
        <div
          className="w-full rounded-t-lg p-4 flex justify-between items-center"
          style={{ backgroundColor: '#3d0000' }}
        >
          <h1 className="text-xl font-bold text-white">
            Request of Change Form
          </h1>
        </div>

        {/* Form Section */}
        <div className="p-8 space-y-4 text-black">
          {/* Task Name */}
          <div>
            <label className="block mb-1 font-semibold">Task name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block mb-1 font-semibold">Details of change</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border rounded px-3 py-2 min-h-[120px]"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block mb-1 font-semibold">Reason for request</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded px-3 py-2 min-h-[100px]"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 border rounded bg-orange-300 font-bold hover:bg-orange-400"
            >
              Submit
            </button>
          </div>

          {/* Submission message */}
          {submitMessage && (
            <div className="text-blue-700 font-semibold mt-2">{submitMessage}</div>
          )}
        </div>
      </div>

      {/* Help Button fixed at bottom-right of the page */}
      <div className="fixed bottom-6 right-6">
        <div className="group relative">
          <button className="w-10 h-10 rounded-full bg-[#ff9999] flex items-center justify-center font-bold text-black">
            ?
          </button>
          <div className="absolute bottom-12 right-0 hidden w-64 max-w-[90vw] rounded bg-white border p-2 text-sm text-black group-hover:block shadow-lg">
            Fill in the task name, describe the details of the change, and provide a reason for the request. 
            Click <b>Submit</b> to send or <b>Cancel</b> to clear the form.
          </div>
        </div>
      </div>
    </div>
  );
}
