"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PipelineStatus } from "@/components/PipelineStatus";
import { formatDate } from "@/lib/utils/format";
import type { Prospect } from "@/lib/db/schema";

interface SitePlan {
  business: {
    name: string;
    phone: string;
    email: string | null;
    address: string;
    hours: string[];
    logo: string | null;
  };
  design: {
    primaryColor: string;
    accentColor: string;
    tone: string;
  };
  seo: {
    siteTitle: string;
    siteDescription: string;
    keywords: string[];
  };
  pages: {
    home: {
      hero: { headline: string; subheadline: string };
      trustBar: { icon: string; text: string }[];
      servicesSummary: { slug: string; name: string; description: string; icon: string }[];
      testimonials: { text: string; author: string; rating: number }[];
    };
    services: {
      slug: string;
      name: string;
      headline: string;
      description: string;
      features: { title: string; description: string }[];
    }[];
    about: {
      headline: string;
      paragraphs: string[];
      whyChooseUs: { title: string; description: string; icon: string }[];
    };
    contact: {
      headline: string;
      description: string;
      serviceArea: {
        headline: string;
        description: string;
        towns: string[];
      };
    };
  };
  improvements: string[];
}

export default function ProspectDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const fetchProspect = useCallback(async () => {
    try {
      const res = await fetch(`/api/prospects?slug=${slug}`);
      if (!res.ok) {
        setError("Prospect not found");
        return;
      }
      const data = await res.json();
      setProspect(data);
    } catch {
      setError("Failed to load prospect");
    }
  }, [slug]);

  useEffect(() => {
    fetchProspect();
  }, [fetchProspect]);

  // Poll while pipeline is active
  useEffect(() => {
    if (!prospect) return;
    const isActive = !["complete", "error"].includes(prospect.status);
    if (!isActive) return;

    const interval = setInterval(fetchProspect, 3000);
    return () => clearInterval(interval);
  }, [prospect, fetchProspect]);

  const handlePlanWebsite = async () => {
    if (!prospect) return;
    setPlanning(true);
    setPlanError(null);

    try {
      const res = await fetch(`/api/prospects/${prospect.id}/plan-site`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate site plan");
      }

      // Refresh prospect to get the updated sitePlan
      await fetchProspect();
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Failed to plan website");
    } finally {
      setPlanning(false);
    }
  };

  const handleBuildDeploy = async () => {
    if (!prospect) return;
    setBuilding(true);
    setBuildError(null);

    try {
      const res = await fetch(`/api/prospects/${prospect.id}/build`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start build");
      }

      // Start polling — builder runs async and updates status
      await fetchProspect();
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Failed to build site");
    } finally {
      setBuilding(false);
    }
  };

  const sitePlan: SitePlan | null = prospect?.sitePlan
    ? JSON.parse(prospect.sitePlan)
    : null;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{prospect.businessName}</h1>
          <PipelineStatus status={prospect.status} />
        </div>
        <p className="text-sm text-zinc-500">
          {prospect.industry} &middot; {prospect.location} &middot;{" "}
          {formatDate(prospect.createdAt)}
        </p>
        {prospect.statusMessage && (
          <p className="mt-1 text-sm text-zinc-400">{prospect.statusMessage}</p>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Lead Intelligence */}
        {(prospect.leadScore || prospect.salesPriority || prospect.phone || prospect.contactEmail) && (
          <div className="rounded-lg border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Lead Intelligence</h2>
              <div className="flex gap-2">
                {prospect.leadScore && (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    prospect.leadScore === "Hot Lead" ? "bg-red-100 text-red-800" :
                    prospect.leadScore === "Warm Lead" ? "bg-orange-100 text-orange-800" :
                    prospect.leadScore === "Cool Lead" ? "bg-blue-100 text-blue-800" :
                    "bg-zinc-100 text-zinc-600"
                  }`}>
                    {prospect.leadScore}
                  </span>
                )}
                {prospect.salesPriority && (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    prospect.salesPriority === "High" ? "bg-green-100 text-green-800" :
                    prospect.salesPriority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-zinc-100 text-zinc-600"
                  }`}>
                    {prospect.salesPriority} Priority
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {prospect.phone && (
                <div>
                  <p className="text-xs text-zinc-400">Phone</p>
                  <a href={`tel:${prospect.phone}`} className="text-sm font-medium text-blue-600 hover:underline">{prospect.phone}</a>
                </div>
              )}
              {prospect.contactEmail && (
                <div>
                  <p className="text-xs text-zinc-400">Email</p>
                  <a href={`mailto:${prospect.contactEmail}`} className="text-sm font-medium text-blue-600 hover:underline">{prospect.contactEmail}</a>
                </div>
              )}
              {prospect.streetAddress && (
                <div>
                  <p className="text-xs text-zinc-400">Address</p>
                  <p className="text-sm">{prospect.streetAddress}</p>
                </div>
              )}
              {prospect.siteQuality && (
                <div>
                  <p className="text-xs text-zinc-400">Site Quality</p>
                  <p className={`text-sm font-medium ${
                    prospect.siteQuality === "No Website" || prospect.siteQuality === "Needs Overhaul" ? "text-red-600" :
                    prospect.siteQuality === "Needs Update" ? "text-orange-600" :
                    prospect.siteQuality === "Acceptable" ? "text-yellow-600" :
                    prospect.siteQuality === "Well Maintained" ? "text-green-600" :
                    "text-zinc-600"
                  }`}>{prospect.siteQuality}</p>
                </div>
              )}
              {prospect.googleSeoRank && (
                <div>
                  <p className="text-xs text-zinc-400">Google SEO</p>
                  <p className="text-sm">{prospect.googleSeoRank}</p>
                </div>
              )}
              {prospect.bbbRating && prospect.bbbRating !== "Not Rated" && (
                <div>
                  <p className="text-xs text-zinc-400">BBB Rating</p>
                  <p className="text-sm font-medium">
                    {prospect.bbbRating}
                    {prospect.bbbAccredited === "Yes" && (
                      <span className="ml-1 text-xs text-green-600">Accredited</span>
                    )}
                  </p>
                </div>
              )}
              {prospect.nySosStatus && prospect.nySosStatus !== "Not Found" && (
                <div>
                  <p className="text-xs text-zinc-400">NY SOS Status</p>
                  <p className={`text-sm font-medium ${
                    prospect.nySosStatus === "Active" ? "text-green-600" : "text-red-600"
                  }`}>{prospect.nySosStatus}</p>
                </div>
              )}
            </div>

            {prospect.opportunityNotes && (
              <div>
                <p className="text-xs text-zinc-400 mb-1">Opportunity</p>
                <p className="text-sm text-zinc-700">{prospect.opportunityNotes}</p>
              </div>
            )}

            {prospect.qualityIssues && (
              <div>
                <p className="text-xs text-zinc-400 mb-1">Quality Notes</p>
                <p className="text-sm text-zinc-600">{prospect.qualityIssues}</p>
              </div>
            )}

            {prospect.redFlags && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs font-medium text-red-700 mb-1">Red Flags</p>
                <p className="text-sm text-red-600">{prospect.redFlags}</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {prospect.status === "complete" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-zinc-500">Report Views</p>
              <p className="text-2xl font-bold">
                {prospect.reportViewCount ?? 0}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-zinc-500">Preview Views</p>
              <p className="text-2xl font-bold">
                {prospect.previewViewCount ?? 0}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-zinc-500">Status</p>
              <p className="text-2xl font-bold capitalize">
                {prospect.status}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          {prospect.previewUrl && (
            <a
              href={prospect.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
            >
              View Preview Site
            </a>
          )}
          {prospect.repoUrl && (
            <a
              href={prospect.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              GitHub Repo
            </a>
          )}
          {prospect.status === "complete" && (
            <Link
              href={`/report/${prospect.slug}`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Intel Report
            </Link>
          )}

          {/* Plan Website button */}
          {prospect.status === "complete" && !sitePlan && (
            <button
              onClick={handlePlanWebsite}
              disabled={planning}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {planning ? "Generating Site Plan..." : "Plan Website"}
            </button>
          )}

          {/* Build & Deploy button */}
          {sitePlan && !prospect.previewUrl && (
            <button
              onClick={handleBuildDeploy}
              disabled={building || prospect.status === "building" || prospect.status === "deploying"}
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {building || prospect.status === "building"
                ? "Building..."
                : prospect.status === "deploying"
                  ? "Deploying..."
                  : "Build & Deploy"}
            </button>
          )}
        </div>

        {/* Plan Error */}
        {planError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Plan Error</p>
            <p className="text-sm text-red-700">{planError}</p>
          </div>
        )}

        {/* Build Error */}
        {buildError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Build Error</p>
            <p className="text-sm text-red-700">{buildError}</p>
          </div>
        )}

        {/* Error Message */}
        {prospect.status === "error" && prospect.errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{prospect.errorMessage}</p>
          </div>
        )}

        {/* ── Site Plan Review ── */}
        {sitePlan && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Website Plan</h2>

            {/* Improvements */}
            {sitePlan.improvements && sitePlan.improvements.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Improvements vs Current Site
                </p>
                <ul className="space-y-1">
                  {sitePlan.improvements.map((item, i) => (
                    <li key={i} className="text-sm text-green-700 flex gap-2">
                      <span className="shrink-0">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Design & Colors */}
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium mb-3">Design</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded border"
                    style={{ backgroundColor: sitePlan.design.primaryColor }}
                  />
                  <span className="text-xs text-zinc-500">
                    Primary {sitePlan.design.primaryColor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded border"
                    style={{ backgroundColor: sitePlan.design.accentColor }}
                  />
                  <span className="text-xs text-zinc-500">
                    Accent {sitePlan.design.accentColor}
                  </span>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                  {sitePlan.design.tone}
                </span>
              </div>
            </div>

            {/* Page Structure Overview */}
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium mb-3">
                Page Structure ({1 + sitePlan.pages.services.length + 2} pages)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2">
                  <p className="text-xs font-medium text-blue-800">Homepage</p>
                  <p className="text-xs text-blue-600">
                    Hero, Services, Testimonials, CTA
                  </p>
                </div>
                {sitePlan.pages.services.map((svc) => (
                  <div
                    key={svc.slug}
                    className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2"
                  >
                    <p className="text-xs font-medium">{svc.name}</p>
                    <p className="text-xs text-zinc-500">
                      {svc.features?.length || 0} features
                    </p>
                  </div>
                ))}
                <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-xs font-medium">About</p>
                  <p className="text-xs text-zinc-500">
                    {sitePlan.pages.about.whyChooseUs?.length || 0} differentiators
                  </p>
                </div>
                <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-xs font-medium">Contact</p>
                  <p className="text-xs text-zinc-500">
                    {sitePlan.pages.contact.serviceArea?.towns?.length || 0} service
                    areas
                  </p>
                </div>
              </div>
            </div>

            {/* Homepage Content Preview */}
            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                Homepage Content
              </summary>
              <div className="border-t px-4 py-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-1">Hero</p>
                  <p className="text-lg font-bold">
                    {sitePlan.pages.home.hero.headline}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {sitePlan.pages.home.hero.subheadline}
                  </p>
                </div>
                {sitePlan.pages.home.trustBar && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">
                      Trust Bar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sitePlan.pages.home.trustBar.map((item, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-zinc-100 px-3 py-1 text-xs"
                        >
                          {item.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {sitePlan.pages.home.servicesSummary && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">
                      Services ({sitePlan.pages.home.servicesSummary.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sitePlan.pages.home.servicesSummary.map((svc) => (
                        <span
                          key={svc.slug}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          {svc.icon} {svc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {sitePlan.pages.home.testimonials &&
                  sitePlan.pages.home.testimonials.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 mb-1">
                        Testimonials ({sitePlan.pages.home.testimonials.length})
                      </p>
                      {sitePlan.pages.home.testimonials.slice(0, 3).map((t, i) => (
                        <p key={i} className="text-xs text-zinc-600 mb-1">
                          &ldquo;{t.text.slice(0, 120)}
                          {t.text.length > 120 ? "..." : ""}&rdquo; &mdash;{" "}
                          {t.author}
                        </p>
                      ))}
                    </div>
                  )}
              </div>
            </details>

            {/* Service Pages */}
            {sitePlan.pages.services.map((svc) => (
              <details key={svc.slug} className="rounded-lg border bg-white">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                  Service: {svc.name}
                </summary>
                <div className="border-t px-4 py-3 space-y-2">
                  <p className="font-medium">{svc.headline}</p>
                  <p className="text-sm text-zinc-600 whitespace-pre-line">
                    {svc.description}
                  </p>
                  {svc.features && svc.features.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-zinc-500 mb-1">
                        Features
                      </p>
                      <ul className="space-y-1">
                        {svc.features.map((f, i) => (
                          <li key={i} className="text-xs text-zinc-600">
                            <strong>{f.title}</strong>: {f.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            ))}

            {/* About Page */}
            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                About Page
              </summary>
              <div className="border-t px-4 py-3 space-y-2">
                <p className="font-medium">{sitePlan.pages.about.headline}</p>
                {sitePlan.pages.about.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-zinc-600">
                    {p}
                  </p>
                ))}
                {sitePlan.pages.about.whyChooseUs &&
                  sitePlan.pages.about.whyChooseUs.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-zinc-500 mb-1">
                        Why Choose Us
                      </p>
                      <ul className="space-y-1">
                        {sitePlan.pages.about.whyChooseUs.map((item, i) => (
                          <li key={i} className="text-xs text-zinc-600">
                            <strong>
                              {item.icon} {item.title}
                            </strong>
                            : {item.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </details>

            {/* Contact Page */}
            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                Contact Page
              </summary>
              <div className="border-t px-4 py-3 space-y-2">
                <p className="font-medium">{sitePlan.pages.contact.headline}</p>
                <p className="text-sm text-zinc-600">
                  {sitePlan.pages.contact.description}
                </p>
                {sitePlan.pages.contact.serviceArea && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-zinc-500 mb-1">
                      Service Area
                    </p>
                    <p className="text-sm text-zinc-600">
                      {sitePlan.pages.contact.serviceArea.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {sitePlan.pages.contact.serviceArea.towns.map((town) => (
                        <span
                          key={town}
                          className="rounded bg-zinc-100 px-2 py-0.5 text-xs"
                        >
                          {town}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>

            {/* SEO Info */}
            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                SEO Configuration
              </summary>
              <div className="border-t px-4 py-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-zinc-500">Site Title</p>
                  <p className="text-sm">{sitePlan.seo.siteTitle}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">
                    Meta Description
                  </p>
                  <p className="text-sm">{sitePlan.seo.siteDescription}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">Keywords</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sitePlan.seo.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-zinc-100 px-2 py-0.5 text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </details>

            {/* Full JSON (collapsible) */}
            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-400">
                Raw Site Plan (JSON)
              </summary>
              <pre className="overflow-auto border-t px-4 py-3 text-xs">
                {JSON.stringify(sitePlan, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Raw Data (collapsible) */}
        {prospect.businessAnalysis && (
          <details className="rounded-lg border bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Business Analysis (JSON)
            </summary>
            <pre className="overflow-auto border-t px-4 py-3 text-xs">
              {JSON.stringify(
                JSON.parse(prospect.businessAnalysis),
                null,
                2
              )}
            </pre>
          </details>
        )}

        {prospect.competitiveIntel && (
          <details className="rounded-lg border bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Competitive Intel (JSON)
            </summary>
            <pre className="overflow-auto border-t px-4 py-3 text-xs">
              {JSON.stringify(
                JSON.parse(prospect.competitiveIntel),
                null,
                2
              )}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}
