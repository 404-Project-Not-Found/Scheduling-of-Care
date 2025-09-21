'use client';

export const dynamic = "force-dynamic";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// ---- Color palette ----
const palette = {
  pageBg: "#ffd9b3",   // page background
  header: "#3A0000",   // dark brown
  banner: "#F9C9B1",   // notice banner
  panelBg: "#fdf4e7",  // panel background
  notice: "#F9C9B1",   // notice bar background
  accent: "#ff9999",   // Info dot color
  question: "#ff9900", // Help bubble background
  button: "#F4A261",   // button background
  text: "#2b2b2b",
  white: "#FFFFFF",
};

export default function RequestChangeFormPage() {
  const router = useRouter();

  const [clientName, setClientName] = useState(''); 
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
    setClientName('');
    setTaskName('');
    setDetails('');
    setReason('');
    setSubmitMessage('');
    router.push('/menu');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ backgroundColor: palette.pageBg }}
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
          backgroundColor: palette.panelBg,
          minHeight: '480px',
        }}
      >
        {/* Header */}
        <div
          className="w-full p-4 flex items-center justify-center"
          style={{ backgroundColor: palette.header }}
        >
          <h1 className="text-xl font-bold text-white text-center w-full">
            Request of Change Form
          </h1>
        </div>

        {/* Form Section */}
        <div className="p-8 space-y-4" style={{ color: palette.text }}>
          {/* Client Name*/}
          <div>
            <label className="block mb-1 font-semibold">Client name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                setSubmitMessage('');
              }}
              className="w-full border-1 rounded px-3 py-2"
              style={{ backgroundColor: palette.white, borderColor: palette.header }}
            />
          </div>

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
              className="w-full border-1 rounded px-3 py-2"
              style={{ backgroundColor: palette.white, borderColor: palette.header }}
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
              className="w-full border-1 rounded px-3 py-2 min-h-[80px]"
              style={{ backgroundColor: palette.white, borderColor: palette.header }}
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
              className="w-full border-1 rounded px-3 py-2 min-h-[60px]"
              style={{ backgroundColor: palette.white, borderColor: palette.header }}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={handleCancel}
              type="button"
              className="px-5 py-2.5 rounded-full font-semibold transition"
              style={{
                border: `1px solid ${palette.header}`,
                color: palette.header,
                backgroundColor: palette.white,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              className="px-6 py-2.5 rounded-full font-bold transition shadow-sm"
              style={{
                backgroundColor: palette.button,
                color: palette.header,
                border: `2px solid ${palette.button}`,
              }}
            >
              Submit
            </button>
          </div>

          {/* Validation message */}
          {submitMessage && (
            <div className="font-semibold mt-2" style={{ color: "red" }}>
              {submitMessage}
            </div>
          )}
        </div>
      </div>

      {/* Help Button fixed at bottom-right of the page */}
      <div className="fixed bottom-6 right-6">
        <div className="group relative">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: palette.question, color: palette.white }}
          >
            ?
          </button>
          <div className="absolute bottom-12 right-0 hidden w-64 max-w-[90vw] rounded bg-white border p-2 text-sm text-black group-hover:block shadow-lg">
            Fill in the client name, task name, describe the details of the change, and provide a reason for the request.
            Click <b>Submit</b> to send or <b>Cancel</b> to go back to the menu.
          </div>
        </div>
      </div>
    </div>
  );
}
