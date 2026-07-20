"use client";

import { useState, useEffect } from "react";
import { MapPin, Briefcase, Bookmark, DollarSign, Lock } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface Job {
  id: string;
  title: string;
  company: string;
  country: string;
  salary: string;
  experience: string;
  type: string;
  category: string;
  price: number;
  status: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companySocials: { platform: string; url: string }[];
  description: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  purchased?: boolean;
}

const METHOD_LABELS: Record<string, string> = {
  mobile_money: "Mobile Money",
  card: "Card",
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
};

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [methodOptions, setMethodOptions] = useState<{ value: string; label: string }[]>([]);
  const [currency, setCurrency] = useState("RWF");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printingJob, setPrintingJob] = useState<Job | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ jobId?: string; message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchPaymentSettings();
  }, [user?.id]);

  async function fetchJobs() {
    setLoading(true);
    try {
      const url = user?.id ? `/api/jobs?userId=${user.id}` : "/api/jobs";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPaymentSettings() {
    try {
      const res = await fetch("/api/payment-settings");
      if (res.ok) {
        const data = await res.json();
        setCurrency(data.currency || "RWF");
        const jobCtx = (data.paymentMethods || []).find((c: any) => c.context === "job_access");
        if (jobCtx?.methods) {
          const enabled = jobCtx.methods
            .filter((m: any) => m.enabled)
            .map((m: any) => ({ value: m.method, label: METHOD_LABELS[m.method] || m.method }));
          if (enabled.length) setMethodOptions(enabled);
        }
      }
    } catch (err) {
      console.error("Error fetching payment settings:", err);
    }
  }

  useEffect(() => {
    if (printingJob) {
      window.print();
      setPrintingJob(null);
    }
  }, [printingJob]);

  async function handleEmailDetails(job: Job) {
    if (!user) return;
    setEmailStatus(null);
    try {
      const res = await fetch("/api/jobs/send-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      setEmailStatus({ jobId: job.id, message: "Details sent to your email.", type: "success" });
    } catch (err: any) {
      setEmailStatus({ jobId: job.id, message: err.message || "Failed to send email.", type: "error" });
    }
  }

  async function handlePurchase(job: Job) {
    if (!user) {
      setError("Please log in to purchase job access.");
      return;
    }
    const method = paymentMethods[job.id] || methodOptions[0]?.value || "mobile_money";
    setPurchasing(job.id);
    setError(null);
    try {
      const res = await fetch("/api/jobs/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userCountry: user.country,
          method,
          amount: job.price,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Purchase failed.");
      } else {
        await fetchJobs();
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  }

  const freeJobs = jobs.filter((j) => j.category === "free" || j.category !== "paid");
  const paidJobs = jobs.filter((j) => j.category === "paid");

  function JobActions({ job }: { job: Job }) {
    if (job.status === "not_available") {
      return <Badge variant="red">Not available</Badge>;
    }

    if (job.category === "paid") {
      if (job.purchased) {
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="green">Purchased</Badge>
            <Button variant="secondary" size="sm" onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}>
              {expandedId === job.id ? "Hide Details" : "View Details"}
            </Button>
            <Button variant="primary" size="sm" onClick={() => alert(`Applying for ${job.title}`)}>
              Apply
            </Button>
          </div>
        );
      }
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-sm font-medium text-yellow">{job.price.toLocaleString()} {currency}</span>
          {methodOptions.length > 0 ? (
            <select
              value={paymentMethods[job.id] || methodOptions[0]?.value}
              onChange={(e) => setPaymentMethods((m) => ({ ...m, [job.id]: e.target.value }))}
              className="rounded-lg bg-muted-bg border border-white/10 px-2 py-1 text-sm"
            >
              {methodOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : null}
          <Button
            variant="premium"
            size="sm"
            disabled={purchasing === job.id}
            onClick={() => handlePurchase(job)}
          >
            {purchasing === job.id ? "Processing..." : "Purchase to Apply"}
          </Button>
        </div>
      );
    }

    return (
      <Button variant="primary" size="sm" onClick={() => alert(`Applying for ${job.title}`)}>
        Apply
      </Button>
    );
  }

  function ContactDetails({ job }: { job: Job }) {
    return (
      <div className="space-y-2 text-sm">
        <p><strong>Email:</strong> {job.companyEmail || "N/A"}</p>
        <p><strong>Phone:</strong> {job.companyPhone || "N/A"}</p>
        <p><strong>Website:</strong> {job.companyWebsite ? <a href={job.companyWebsite} target="_blank" rel="noreferrer" className="text-blue hover:underline">{job.companyWebsite}</a> : "N/A"}</p>
        {job.companySocials && job.companySocials.length > 0 && (
          <div>
            <strong>Social Media:</strong>
            <ul className="list-disc list-inside mt-1">
              {job.companySocials.map((s, i) => (
                <li key={i}>
                  {s.platform}: <a href={s.url} target="_blank" rel="noreferrer" className="text-blue hover:underline">{s.url}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Careers"
            title="Barista Jobs"
            description="Worldwide opportunities for talented baristas."
          />
          <div className="flex items-center justify-center py-12">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 pb-16 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Careers"
            title="Barista Jobs"
            description="Browse free job listings or unlock paid opportunities."
          />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red/10 border border-red/30 text-red text-sm">
              {error}
            </div>
          )}

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Badge variant="green">Free</Badge> Jobs to Join
              </h2>
              {freeJobs.length === 0 ? (
                <p className="text-muted text-sm">No free jobs available right now.</p>
              ) : (
                <div className="space-y-4">
                  {freeJobs.map((job) => (
                    <Card key={job.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <Badge variant="blue">{job.type}</Badge>
                          {job.status === "not_available" && <Badge variant="red">Not available</Badge>}
                        </div>
                        <p className="text-muted text-sm mb-3">{job.company}</p>
                        <p className="text-sm mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-green" /> {job.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-yellow" /> {job.salary}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4 text-blue" /> {job.experience}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSaved((s) =>
                              s.includes(job.id) ? s.filter((id) => id !== job.id) : [...s, job.id]
                            )
                          }
                        >
                          <Bookmark className={`h-4 w-4 ${saved.includes(job.id) ? "fill-yellow text-yellow" : ""}`} />
                        </Button>
                        <JobActions job={job} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Badge variant="yellow" className="flex items-center gap-1"><Lock className="h-3 w-3" /> Paid</Badge> Jobs
              </h2>
              {paidJobs.length === 0 ? (
                <p className="text-muted text-sm">No paid jobs available right now.</p>
              ) : (
                <div className="space-y-4">
                  {paidJobs.map((job) => (
                    <div key={job.id}>
                      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <Badge variant="blue">{job.type}</Badge>
                            {job.purchased ? <Badge variant="green">Purchased</Badge> : <Badge variant="yellow">Paid</Badge>}
                            {job.status === "not_available" && <Badge variant="red">Not available</Badge>}
                          </div>
                          <p className="text-muted text-sm mb-3">{job.company}</p>
                          <p className="text-sm mb-3">{job.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-green" /> {job.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-yellow" /> {job.salary}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4 text-blue" /> {job.experience}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 items-start md:items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSaved((s) =>
                                s.includes(job.id) ? s.filter((id) => id !== job.id) : [...s, job.id]
                              )
                            }
                          >
                            <Bookmark className={`h-4 w-4 ${saved.includes(job.id) ? "fill-yellow text-yellow" : ""}`} />
                          </Button>
                          <JobActions job={job} />
                        </div>
                      </Card>
                      {expandedId === job.id && job.purchased && (
                        <Card className="mt-2 border border-blue/20 bg-blue/5">
                          <h4 className="font-semibold mb-3">Company Contact Details</h4>
                          <ContactDetails job={job} />
                          {emailStatus?.jobId === job.id && (
                            <p className={`mt-3 text-xs ${emailStatus.type === "success" ? "text-green" : "text-red"}`}>
                              {emailStatus.message}
                            </p>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button variant="secondary" size="sm" onClick={() => setPrintingJob(job)}>
                              Download PDF
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => handleEmailDetails(job)}>
                              Email Details
                            </Button>
                          </div>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {printingJob && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 overflow-auto z-50">
          <h1 className="text-2xl font-bold mb-2">{printingJob.title}</h1>
          <p className="mb-1"><strong>Company:</strong> {printingJob.company}</p>
          <p className="mb-1"><strong>Location:</strong> {printingJob.country}</p>
          <p className="mb-1"><strong>Salary:</strong> {printingJob.salary}</p>
          <p className="mb-1"><strong>Experience:</strong> {printingJob.experience}</p>
          <p className="mb-1"><strong>Type:</strong> {printingJob.type}</p>
          <hr className="my-4 border-gray-300" />
          <h2 className="text-lg font-bold mb-2">Job Description</h2>
          <p className="mb-4">{printingJob.description}</p>
          <h2 className="text-lg font-bold mb-2">Company Contact Details</h2>
          <p><strong>Email:</strong> {printingJob.companyEmail || "N/A"}</p>
          <p><strong>Phone:</strong> {printingJob.companyPhone || "N/A"}</p>
          <p><strong>Website:</strong> {printingJob.companyWebsite || "N/A"}</p>
          {printingJob.companySocials && printingJob.companySocials.length > 0 && (
            <>
              <h3 className="font-bold mt-4 mb-2">Social Media</h3>
              <ul className="list-disc list-inside">
                {printingJob.companySocials.map((s, i) => (
                  <li key={i}>{s.platform}: {s.url}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </>
  );
}
