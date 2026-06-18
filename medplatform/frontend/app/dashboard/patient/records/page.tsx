"use client";
import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import { MedicalRecord } from "@/types";
import { FileText, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  LAB_RESULT:    "bg-blue-50 text-blue-700",
  CLINICAL_NOTE: "bg-gray-50 text-gray-700",
  DIAGNOSIS:     "bg-red-50 text-red-700",
  PRESCRIPTION:  "bg-purple-50 text-purple-700",
  ALLERGY:       "bg-orange-50 text-orange-700",
};

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");

  useEffect(() => {
    recordsApi.getMy().then((data) => {
      setRecords(data as MedicalRecord[]);
      setLoading(false);
    });
  }, []);

  const categories = ["ALL", "LAB_RESULT", "CLINICAL_NOTE", "DIAGNOSIS", "PRESCRIPTION", "ALLERGY"];
  const filtered = filter === "ALL" ? records : records.filter((r) => r.category === filter);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-600" />
          My Medical Records
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-gray-500 text-sm">Read-only view. Records are managed by your healthcare provider.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === c ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {c.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading records…</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="card p-0 overflow-hidden">
              <button
                className="w-full text-left px-6 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-start gap-3">
                  <span className={`badge mt-0.5 ${CATEGORY_COLORS[r.category] || "bg-gray-50 text-gray-700"}`}>
                    {r.category.replace("_", " ")}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(r.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                {expanded === r.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                }
              </button>

              {expanded === r.id && (
                <div className="px-6 pb-5 border-t border-gray-50">
                  <pre className="mt-3 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 font-sans">
                    {r.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
