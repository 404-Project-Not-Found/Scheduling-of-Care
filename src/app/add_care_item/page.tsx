'use client';

import React, { useState } from 'react';

export default function AddCareItemPage() {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [category, setCategory] = useState('');
  const [notification, setNotification] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isYearly, setIsYearly] = useState(false);

  const handleRepeatYearly = (isYearly: boolean) => {
    if (isYearly) {
      setIsYearly(isYearly);
      setNotification('This care item will repeat yearly');
    } else {
      setNotification('');
    }
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !frequency || !startDate || !category) {
      setSubmitMessage('Please fill in all fields before submitting.');
      return;
    }
    console.log({
      name,
      frequency,
      startDate,
      category,
      repeatYearly: notification ? true : false,
    });

    try{
      const res = await fetch("/api/add_care_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, frequency, startDate, category, isYearly}),
      });
      
      
      const data = await res.json();
      if(res.ok) {
        setNotification(data.message);
        setSubmitMessage('Care item submitted successfully!');
        setName('');
        setFrequency('');
        setStartDate('');
        setCategory('');
       } else {
        setNotification(data.error);
        setSubmitMessage('An error has occured when submitting task, failed to add care item.');
      }
      
    } catch(err) {
      console.error(err);
      setNotification("Something went wrong");
    }

    /*
    setSubmitMessage('Care item submitted successfully!');
    setName('');
    setFrequency('');
    setStartDate('');
    setCategory('');
    setNotification('');
    */
  };

  const handleCancel = () => {
    setName('');
    setFrequency('');
    setStartDate('');
    setCategory('');
    setNotification('');
    setSubmitMessage('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ backgroundColor: '#ffd9b3' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-2xl border rounded-lg shadow-lg"
        style={{ backgroundColor: '#fff4e6', minHeight: '700px' }}
      >
        {/* Header Banner */}
        <div
          className="w-full rounded-t-lg p-4"
          style={{ backgroundColor: '#3d0000' }}
        >
          <h1 className="text-xl font-bold text-white">Add Care Item</h1>
        </div>

        {/* Form Section */}
        <div className="p-8 space-y-4 text-black">
          {/* Name */}
          <div>
            <label className="block mb-1 font-semibold">Name of Care Item:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block mb-1 font-semibold">Frequency:</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Start Date with Calendar */}
          <div>
            <label className="block mb-1 font-semibold">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 font-semibold">Category:</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Repeat Yearly */}
          <div>
            <label className="block mb-2 font-semibold">Repeat Yearly?:</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleRepeatYearly(true)}
                className="px-4 py-2 border rounded hover:bg-gray-200"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleRepeatYearly(false)}
                className="px-4 py-2 border rounded hover:bg-gray-200"
              >
                No
              </button>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div className="text-green-700 font-semibold">{notification}</div>
          )}

          {/* Submit/Cancel */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-200"
            >
              Submit
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>

          {/* Submission message */}
          {submitMessage && (
            <div className="text-blue-700 font-semibold mt-2">{submitMessage}</div>
          )}
        </div>
      </div>

      {/* Help Button fixed at page bottom-right */}
      <div className="fixed bottom-6 right-6">
        <div className="group relative">
          <button
            className="w-10 h-10 rounded-full bg-[#ff9999] flex items-center justify-center font-bold text-black"
          >
            ?
          </button>
          <div className="absolute bottom-full right-0 mb-2 hidden w-64 max-w-[90vw] rounded bg-white border p-2 text-sm text-black group-hover:block shadow-lg">
            {"Enter the care item name, frequency, start date, and category. Select \"Yes\" if this care item repeats yearly. Click Submit to save."}
          </div>
        </div>
      </div>
    </div>
  );
}
