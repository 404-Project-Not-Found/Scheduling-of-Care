'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RequestChangeFormPage() {
  const router = useRouter();

  const [taskName, setTaskName] = useState('');
  const [details, setDetails] = useState('');
  const [reason, setReason] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = () => {
    if (!taskName || !details || !reason) {
      setSubmitMessage('Please fill in all fields before submitting.');
      return;
    }
    router.push('/menu');
  };

  const handleCancel = () => {
    setTaskName('');
    setDetails('');
    setReason('');
    setSubmitMessage('');
    router.push('/menu');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ backgroundColor: '#ffd9b3' }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 left-6">
        <Image
          src="/logo-name.png"
          alt="Scheduling of Care"
          width={220}
          height={80}
          className="object-contain"
          priority
        />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-3xl rounded-3xl shadow-lg relative overflow-hidden"
        style={{
          backgroundColor: '#fff4e6',
          minHeight: '480px',
        }}
      >
        {/* Header */}
        <div
          className="w-full p-4 flex items-center justify-center"
          style={{ backgroundColor: '#3d0000' }}
        >
          <h1 className="text-xl font-bold text-white text-center w-full">
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
              onChange={(e) => {
                setTaskName(e.target.value);
                setSubmitMessage('');
              }}
              className="w-full border rounded px-3 py-2 bg-white"
            />
          </div>

          {/* Details */}
          <div>
            <label className="block mb-1 font-semibold">Details of change</label>
            <textarea
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);
                setSubmitMessage('');
              }}
              className="w-full border rounded px-3 py-2 min-h-[120px] bg-white"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block mb-1 font-semibold">Reason for request</label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSubmitMessage('');
              }}
              className="w-full border rounded px-3 py-2 min-h-[100px] bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={handleCancel}
              type="button"
              className="px-5 py-2.5 border border-[#3d0000]/40 text-[#3d0000] rounded-full hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              className="px-6 py-2.5 rounded-full bg-orange-300 font-bold text-[#3d0000] border border-orange-400 hover:bg-orange-400 transition shadow-sm"
            >
              Submit
            </button>
          </div>

          {/* Validation message */}
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
            Click <b>Submit</b> to send or <b>Cancel</b> to go back to the menu.
          </div>
        </div>
      </div>
    </div>
  );
}
