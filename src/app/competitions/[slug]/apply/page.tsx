"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, User, Briefcase, FileText, Phone, Calendar, Video, AlertTriangle, Users } from "lucide-react";
import { useAdminData } from "@/lib/admin-data-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumber, parsePhoneValue } from "@/lib/phone-utils";
import { ApplicationConfirmDialog } from "@/components/competitions/application-confirm-dialog";
import type { Competition } from "@/types";

type Step = "terms" | "application" | "submitted";

export default function ApplyPage() {
  const { competitions, supportedCountries } = useAdminData();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = decodeURIComponent(params.slug as string);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loadingCompetition, setLoadingCompetition] = useState(true);
  const [step, setStep] = useState<Step>("terms");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [over18, setOver18] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    country: "",
    mobileNumber: "",
    email: "",
    birthDate: "",
    gender: "",
    experience: "",
    skills: "",
    motivation: "",
    videoUrl: "",
    profilePhotoUrl: "",
  });
  const [videoInputMethod, setVideoInputMethod] = useState<"url" | "upload">("url");

  useEffect(() => {
    // First try to find in context
    const fromContext = competitions.find((c) => c.slug === slug);
    if (fromContext) {
      setCompetition(fromContext);
      setLoadingCompetition(false);
      return;
    }

    // Fallback: fetch directly from API
    async function fetchCompetition() {
      try {
        const res = await fetch(`/api/competitions?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setCompetition(data);
        } else {
          setCompetition(null);
        }
      } catch (error) {
        console.error("Error fetching competition:", error);
        setCompetition(null);
      } finally {
        setLoadingCompetition(false);
      }
    }
    fetchCompetition();
  }, [slug, competitions]);

  // Poll for latest competition data so users see slot/ status changes in real time
  useEffect(() => {
    if (!slug) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/competitions?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setCompetition(data);
        }
      } catch (error) {
        console.error("Error polling competition:", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [slug]);

  // The application experience level is always the competition difficulty.
  useEffect(() => {
    if (competition?.difficulty) {
      setFormData((prev) => ({ ...prev, experience: competition.difficulty }));
    }
  }, [competition?.difficulty]);

  if (loadingCompetition) {
    return (
      <div className="pt-32 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto" />
        <p className="text-muted text-sm mt-4">Loading competition...</p>
      </div>
    );
  }

  if (!competition) {
    return <div className="pt-32 text-center">Competition not found</div>;
  }

  if (competition.status === "completed") {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold mb-4">{competition.title}</h1>
          <div className="glass-card rounded-2xl p-8 border border-yellow/20 bg-yellow/5">
            <AlertTriangle className="h-12 w-12 text-yellow mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Applications Closed</h2>
            <p className="text-muted mb-6">
              This competition has already ended and no longer accepts applications.
              Thank you for your interest.
            </p>
            <Button variant="primary" onClick={() => router.push("/competitions")}>
              Browse Competitions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (competition.status === "judging") {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold mb-4">{competition.title}</h1>
          <div className="glass-card rounded-2xl p-8 border border-yellow/20 bg-yellow/5">
            <AlertTriangle className="h-12 w-12 text-yellow mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Applications Closed - Judging in Progress</h2>
            <p className="text-muted mb-6">
              This competition is no longer accepting applications. Judging is currently in progress.
            </p>
            <Button variant="primary" onClick={() => router.push("/competitions")}>
              Browse Competitions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (competition.availableSlots <= 0) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold mb-4">{competition.title}</h1>
          <div className="glass-card rounded-2xl p-8 border border-red/20 bg-red/5">
            <AlertTriangle className="h-12 w-12 text-red mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">All slots have been filled</h2>
            <p className="text-muted mb-6">
              This competition has reached its maximum number of applicants. No more applications are being accepted.
            </p>
            <Button variant="primary" onClick={() => router.push("/competitions")}>
              Browse Competitions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: "terms", label: "Terms & Conditions" },
    { id: "application", label: "Application Form" },
    { id: "submitted", label: "Application Submitted" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);
  const today = new Date().toISOString().split("T")[0];

  const handleFileUpload = async (file: File, type: "video" | "photo") => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("type", type);

    const uploadUrl = type === "video" ? "/api/upload" : "/api/upload";

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setErrorMessage(null);
        if (type === "video") {
          setFormData({ ...formData, videoUrl: data.url });
        } else {
          setFormData({ ...formData, profilePhotoUrl: data.url });
        }
        return data.url;
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Upload failed. Please try again.");
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage("Upload failed. Please try again.");
      return null;
    }
  };

  const handleSubmitApplication = async () => {
    // Validate all required fields and set errors
    const errors: Record<string, boolean> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = true;
    }
    if (!formData.country) {
      errors.country = true;
    }
    const phoneValidation = validatePhoneNumber(formData.mobileNumber);
    if (!phoneValidation.valid) {
      errors.mobileNumber = true;
    }
    if (!formData.email.trim()) {
      errors.email = true;
    }
    if (!formData.birthDate.trim()) {
      errors.birthDate = true;
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (isNaN(birthDate.getTime()) || birthDate > today) {
        errors.birthDate = true;
      } else {
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        if (adjustedAge < 18) {
          errors.birthDate = true;
        }
      }
    }
    if (!formData.gender) {
      errors.gender = true;
    }
    if (!over18) {
      errors.over18 = true;
    }
    if (!formData.experience) {
      errors.experience = true;
    }
    if (!formData.skills.trim()) {
      errors.skills = true;
    }
    if (!formData.motivation.trim()) {
      errors.motivation = true;
    }
    if (!formData.videoUrl.trim()) {
      errors.videoUrl = true;
    }
    if (!formData.profilePhotoUrl.trim()) {
      errors.profilePhotoUrl = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.mobileNumber && phoneValidation.error) {
        setErrorMessage(phoneValidation.error);
      }
      return;
    }

    // No login required - anyone can apply
    setErrorMessage(null);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/competitions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          competitionId: competition.id,
          fullName: formData.fullName,
          country: formData.country,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          birthDate: formData.birthDate,
          gender: formData.gender,
          over18,
          experience: formData.experience,
          skills: formData.skills,
          motivation: formData.motivation,
          videoUrl: formData.videoUrl,
          profilePhotoUrl: formData.profilePhotoUrl,
        }),
      });

      if (response.ok) {
        setShowConfirmDialog(false);
        setStep("submitted");
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data.error || "Failed to submit application. Please try again.");
        setShowConfirmDialog(false);
      }
    } catch (error) {
      console.error("Application error:", error);
      setErrorMessage("Failed to submit application. Please try again.");
      setShowConfirmDialog(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-2">Apply to {competition.title}</h1>
        <p className="text-muted mb-8">Submit your application to participate in this competition.</p>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i <= currentStepIndex
                    ? "bg-blue text-white"
                    : "bg-muted-bg text-muted"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= currentStepIndex ? "text-foreground" : "text-muted"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {step === "terms" && (
          <Card>
            <div className="flex items-start gap-3 mb-4 p-4 rounded-xl bg-red/10 border border-red/30">
              <AlertTriangle className="h-5 w-5 text-red shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red mb-1">Important - Read Carefully</p>
                <p className="text-sm text-muted">
                  Before proceeding, please read and understand the following terms and conditions. Your application will be reviewed by our team, and only qualified applicants will be nominated to proceed with payment.
                </p>
              </div>
            </div>
            <CardTitle className="mb-4">Terms & Conditions</CardTitle>
            <div className="prose prose-sm dark:prose-invert max-h-64 overflow-y-auto mb-6 text-sm text-muted space-y-2">
              {competition.rules.map((rule, i) => (
                <p key={i}>• {rule}</p>
              ))}
              <p className="font-medium text-foreground mt-4">Video Requirements:</p>
              <p>• Upload a clear, high-quality, unedited video demonstrating your barista skills</p>
              <p>• Video must be between 2-5 minutes in duration</p>
              <p>• Minimum resolution: 720p (1280x720)</p>
              <p>• Recommended resolution: 1080p (1920x1080)</p>
              <p>• Good lighting and clear audio are required</p>
              <p>• Video must show your face and hands clearly while performing techniques</p>
              <p>• No filters, effects, or post-production editing allowed</p>
              <p>• Demonstrate understanding of competition rules and requirements</p>
              <p>• Include latte art, espresso preparation, or relevant skills based on competition type</p>
              <p className="font-medium text-foreground mt-4">Profile Photo Requirements:</p>
              <p>• Professional headshot or clear photo of yourself</p>
              <p>• High resolution (minimum 300x300 pixels)</p>
              <p>• Good lighting, no filters or heavy editing</p>
              <p>• Face clearly visible</p>
              <p className="font-medium text-foreground mt-4">Application Process:</p>
              <p>• Applications will be reviewed by our team based on the requirements.</p>
              <p>• Only qualified applicants will be nominated.</p>
              <p>• If nominated, you will receive an email with a temporary access link.</p>
              <p>• The access link will direct you to the payment board.</p>
              <p>• You must pay the entry fee within 3 days of nomination.</p>
              <p>• After payment confirmation, you will access the participant dashboard.</p>
              <p>• Your temporary account will expire after the competition ends.</p>
              <p>• Winners will retain access to their wallet for prize withdrawal.</p>
              <p>• Non-winners&apos; accounts will be permanently closed after the competition.</p>
            </div>
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 rounded border-white/20"
              />
              <span className="text-sm">I have read, understood, and accept the terms and conditions</span>
            </label>
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={over18}
                onChange={(e) => setOver18(e.target.checked)}
                className="h-4 w-4 rounded border-white/20"
              />
              <span className="text-sm">I confirm that I am 18 years of age or older</span>
            </label>
            <Button
              variant="primary"
              disabled={!acceptedTerms || !over18}
              onClick={() => setStep("application")}
            >
              Continue to Application
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        )}

        {step === "application" && (
          <Card>
            <CardTitle className="mb-4">Competition Application</CardTitle>
            <p className="text-sm text-muted mb-6">Please fill in all required fields marked with *</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-muted mb-1 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      setFieldErrors({ ...fieldErrors, fullName: false });
                    }}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.fullName ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    placeholder="Iraguha Mugisha"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Country *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      const selectedCountry = e.target.value;
                      const matched = supportedCountries.find(
                        (c) => c.name.toLowerCase() === selectedCountry.toLowerCase()
                      );
                      setFormData((prev) => {
                        const parsed = parsePhoneValue(prev.mobileNumber);
                        const mobileNumber =
                          selectedCountry && matched && selectedCountry !== "All Countries"
                            ? `${matched.dialCode}${parsed.localNumber}`
                            : prev.mobileNumber;
                        return { ...prev, country: selectedCountry, mobileNumber };
                      });
                      setFieldErrors((prev) => ({ ...prev, country: false, mobileNumber: false }));
                    }}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 appearance-none ${fieldErrors.country ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    required
                  >
                    <option value="">Select country</option>
                    {competition.countriesAllowed.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Mobile Number *</label>
                <PhoneInput
                  value={formData.mobileNumber}
                  onChange={(value) => {
                    setFormData({ ...formData, mobileNumber: value });
                    setFieldErrors({ ...fieldErrors, mobileNumber: false });
                  }}
                  error={fieldErrors.mobileNumber}
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="788123456"
                  required
                  className="w-full"
                />
                <p className="text-xs text-muted mt-1">Enter your phone number with the country code (e.g. +250 788 123 456)</p>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Email *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setFieldErrors({ ...fieldErrors, email: false });
                    }}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.email ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    placeholder="iraguha.mugisha@example.rw"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Birth Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="date"
                    max={today}
                    value={formData.birthDate}
                    onChange={(e) => {
                      setFormData({ ...formData, birthDate: e.target.value });
                      setFieldErrors({ ...fieldErrors, birthDate: false });
                    }}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.birthDate ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    required
                  />
                </div>
                <p className="text-xs text-muted mt-1">You must be at least 18 years old</p>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Gender *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <select
                    value={formData.gender}
                    onChange={(e) => {
                      setFormData({ ...formData, gender: e.target.value });
                      setFieldErrors({ ...fieldErrors, gender: false });
                    }}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 appearance-none ${fieldErrors.gender ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Experience Level *</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <select
                    value={formData.experience}
                    onChange={(e) => {
                      setFormData({ ...formData, experience: e.target.value });
                      setFieldErrors({ ...fieldErrors, experience: false });
                    }}
                    disabled
                    title="Your experience level is fixed to the competition difficulty and cannot be changed"
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 appearance-none disabled:opacity-70 disabled:cursor-not-allowed ${fieldErrors.experience ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    required
                  >
                    <option value="">Select experience level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Professional">Professional</option>
                    <option value="Master">Master</option>
                  </select>
                </div>
                <p className="text-xs text-muted mt-1">
                  This competition requires {competition.difficulty} experience. You can only move up levels, never downgrade.
                </p>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Skills *</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <textarea
                    value={formData.skills}
                    onChange={(e) => {
                      setFormData({ ...formData, skills: e.target.value });
                      setFieldErrors({ ...fieldErrors, skills: false });
                    }}
                    rows={3}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none ${fieldErrors.skills ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    placeholder="Describe your relevant skills (e.g., latte art, espresso preparation, customer service)"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Motivation *</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => {
                      setFormData({ ...formData, motivation: e.target.value });
                      setFieldErrors({ ...fieldErrors, motivation: false });
                    }}
                    rows={3}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none ${fieldErrors.motivation ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    placeholder="Why do you want to participate in this competition?"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Video Rules Upload *</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setVideoInputMethod("url")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      videoInputMethod === "url"
                        ? "bg-blue text-white"
                        : "bg-muted-bg text-muted hover:text-foreground"
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoInputMethod("upload")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      videoInputMethod === "upload"
                        ? "bg-blue text-white"
                        : "bg-muted-bg text-muted hover:text-foreground"
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {videoInputMethod === "url" ? (
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, videoUrl: e.target.value });
                        setFieldErrors({ ...fieldErrors, videoUrl: false });
                      }}
                      className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.videoUrl ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                      placeholder="Paste video URL (YouTube, Vimeo, etc.)"
                      required
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingVideo(true);
                          handleFileUpload(file, "video").finally(() => setUploadingVideo(false));
                        }
                      }}
                      className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.videoUrl ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                      required={!formData.videoUrl}
                    />
                    {uploadingVideo && (
                      <p className="text-xs text-muted mt-1">Uploading video...</p>
                    )}
                    {formData.videoUrl && !uploadingVideo && (
                      <p className="text-xs text-green mt-1">Video uploaded successfully</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Profile Photo Upload *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingPhoto(true);
                        handleFileUpload(file, "photo").finally(() => setUploadingPhoto(false));
                      }
                    }}
                    className={`w-full rounded-xl bg-muted-bg border pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 ${fieldErrors.profilePhotoUrl ? 'border-red focus:ring-red' : 'border-white/10 focus:ring-blue'}`}
                    required={!formData.profilePhotoUrl}
                  />
                  {uploadingPhoto && (
                    <p className="text-xs text-muted mt-1">Uploading photo...</p>
                  )}
                  {formData.profilePhotoUrl && !uploadingPhoto && (
                    <p className="text-xs text-green mt-1">Photo uploaded successfully</p>
                  )}
                </div>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("terms")}>
                Back
              </Button>
              <Button variant="primary" onClick={handleSubmitApplication}>
                Submit Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {step === "submitted" && (
          <Card>
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green" />
              </div>
              <CardTitle className="mb-2">Application Submitted!</CardTitle>
              <p className="text-muted text-sm mb-6">
                Your application has been received and will be reviewed by our team. If nominated, you will receive an email with a payment link.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => router.push("/competitions")}>
                  Browse Competitions
                </Button>
                <Button variant="primary" onClick={() => router.push("/")}>
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <ApplicationConfirmDialog
        open={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmSubmit}
        isLoading={loading}
      />
    </div>
  );
}
