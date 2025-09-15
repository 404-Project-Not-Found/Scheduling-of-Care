// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Immediately redirect root ("/") to "/update-details"
  redirect("/update-details");
}
