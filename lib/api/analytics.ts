"use client";

import { axiosInstance } from "./mutator";

export async function downloadAnalyticsCsv(days: number): Promise<void> {
  const res = await axiosInstance.get("/api/v1/seller/analytics/export.csv", {
    params: { days },
    responseType: "blob",
  });

  const url = URL.createObjectURL(res.data as Blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `nemalika-analytics-${days}d.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
