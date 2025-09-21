"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/context/TransactionContext";

const colors = {
  pageBg: "#ffd9b3",
  cardBg: "#fff4e6",
  header: "#3d0000",
  text: "#000000",
  orange: "#f6a56f",
};

export default function AddTransactionPage() {
  const router = useRouter();
  const { addTransaction } = useTransactions();

  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [carer, setCarer] = useState("");
  const [items, setItems] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!receiptFile) {
      alert("Please upload a receipt before submitting.");
      return;
    }

    addTransaction({
      type,
      date,
      madeBy: carer,
      receipt: receiptFile.name, // store file name (or handle actual upload)
      items: items.split(",").map((i) => i.trim()),
    });
    router.push("/transaction_history");
  };

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative"
      style={{ backgroundColor: colors.pageBg }}
    >
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

      <div
        className="w-full max-w-2xl rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
      >
        <div
          className="w-full flex items-center justify-center px-6 py-4"
          style={{ backgroundColor: colors.header }}
        >
          <h1 className="text-2xl font-bold text-white">Add New Transaction</h1>
        </div>

        <div className="px-8 py-8 space-y-5 text-black">
          <input
            type="text"
            placeholder="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded-md px-4 py-3"
          />
          <input
            type="text"
            placeholder="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-md px-4 py-3"
          />
          <input
            type="text"
            placeholder="Carer Name"
            value={carer}
            onChange={(e) => setCarer(e.target.value)}
            className="w-full border rounded-md px-4 py-3"
          />
          <input
            type="text"
            placeholder="Associated Care Items (comma separated)"
            value={items}
            onChange={(e) => setItems(e.target.value)}
            className="w-full border rounded-md px-4 py-3"
          />

          {/* Upload Receipt Section */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Upload Receipt:</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setReceiptFile(e.target.files[0]);
                }
              }}
              className="border rounded-md px-3 py-2"
            />
            {receiptFile && (
              <span className="text-sm text-gray-700">Selected file: {receiptFile.name}</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-6 mt-4">
            <button
              type="button"
              className="px-6 py-2.5 rounded-full border text-gray-700 hover:bg-gray-200"
              onClick={() => router.push("/transaction_history")}
            >
              Cancel
            </button>

            <button
              type="button"
              className="px-7 py-2.5 rounded-full font-semibold border"
              style={{ backgroundColor: "white", borderColor: "#ccc", color: colors.header }}
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </main>
  );
}
