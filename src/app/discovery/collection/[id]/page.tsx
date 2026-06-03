'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Download,
  Folder,
  MapPin,
  Loader2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Percent,
  Users,
  CheckCircle,
  Briefcase,
  Search,
  Filter,
  Star,
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  website: string | null;
  verifiedWebsite: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  leadIntelligence?: {
    leadScore: number;
    leadTier: string;
    salesReadinessScore: number | null;
    salesReadinessTier: string | null;
    reachabilityScore: number | null;
    contactabilityTier: string | null;
  } | null;
  socialProfiles: Array<{ platform: string; url: string }>;
  opportunities: Array<{ serviceType: string }>;
}

interface CollectionDetails {
  id: string;
  keyword: string;
  location: string;
  status: string;
  targetCount: number;
  totalFound: number;
  totalProcessed: number;
  createdAt: string;
  currentKeyword: string | null;
  currentLocation: string | null;
  businessesFailed: number;
  businessesAudited: number;
  stats: any;
  leadCount: number;
  reachableLeads: number;
  verifiedWebsites: number;
  ownersFound: number;
  socialProfilesFound: number;
  avgLeadScore: number;
  avgSalesReadiness: number;
  opportunitiesCount: number;
  completionPercent: number;
  estimatedAvailable: number;
  saturationStatus: string;
  businesses: Business[];
  keywords?: string[];
  locations?: string[];
}

export default function CollectionDashboardPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const collectionId = params.id;

  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [readinessFilter, setReadinessFilter] = useState('');
  const [contactabilityFilter, setContactabilityFilter] = useState('');

  // Row action status
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchCollectionDetails = async () => {
    try {
      const res = await fetch(`/api/discovery/status/${collectionId}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data.job || null);
      } else {
        setError('Collection not found');
      }
    } catch (e: any) {
      setError('Error loading collection details: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionDetails();

    // Auto refresh progress
    const interval = setInterval(() => {
      fetchCollectionDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [collectionId]);

  // Run audit trigger
  const handleRunAudit = async (businessId: string) => {
    setActioningId(businessId);
    setActionMessage('');
    try {
      const res = await fetch(`/api/audit/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'FAST' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage('FAST website audit queued successfully!');
        fetchCollectionDetails();
      } else {
        setActionMessage(data.error || 'Failed to trigger audit.');
      }
    } catch (err: any) {
      setActionMessage('Error: ' + err.message);
    } finally {
      setActioningId(null);
      setTimeout(() => setActionMessage(''), 5000);
    }
  };

  // Create Deal trigger
  const handleCreateDeal = async (businessId: string) => {
    setActioningId(businessId);
    setActionMessage('');
    try {
      const res = await fetch('/api/crm/deals/create-from-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`Deal created! Title: ${data.deal.title}`);
      } else {
        setActionMessage(data.error || 'Failed to create deal.');
      }
    } catch (err: any) {
      setActionMessage('Error: ' + err.message);
    } finally {
      setActioningId(null);
      setTimeout(() => setActionMessage(''), 5000);
    }
  };

  if (loading && !collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#2563EB]" />
        <p className="text-[#A1A1AA] mt-4 text-sm font-semibold">Loading collection dashboard...</p>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="p-8 text-center bg-[#111113] border border-[#27272A] rounded-lg max-w-lg mx-auto mt-20">
        <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
        <h2 className="text-lg font-bold text-[#FAFAFA]">Access Error</h2>
        <p className="text-xs text-[#A1A1AA] mt-2 mb-6">{error || 'Collection not found'}</p>
        <Link
          href="/discovery"
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#2563EB]/80 text-[#FAFAFA] rounded text-xs font-bold transition-colors"
        >
          Back to Collections
        </Link>
      </div>
    );
  }

  // Filter leads client-side
  const filteredBusinesses = collection.businesses?.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.industry && b.industry.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = !tierFilter || b.leadIntelligence?.leadTier === tierFilter;
    const matchesReadiness =
      !readinessFilter || b.leadIntelligence?.salesReadinessTier === readinessFilter;
    const matchesContactability =
      !contactabilityFilter || b.leadIntelligence?.contactabilityTier === contactabilityFilter;

    return matchesSearch && matchesTier && matchesReadiness && matchesContactability;
  }) || [];

  const completionPercent = collection.completionPercent ?? 0;
  const statusColors =
    collection.status === 'COMPLETED'
      ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
      : collection.status === 'RUNNING'
      ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30 animate-pulse'
      : collection.status === 'SATURATED'
      ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
      : 'bg-[#A1A1AA]/10 text-[#A1A1AA] border-[#A1A1AA]/20';

  const hasIntel = collection.leadCount > 0;

  return (
    <div className="space-y-8">
      {/* Back navigation & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/discovery"
          className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1.5 self-start"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Collections
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`/api/discovery/export?collectionId=${collection.id}&format=csv`}
            download
            className="px-3.5 py-1.5 bg-[#27272A] hover:bg-[#27272A]/80 text-[#FAFAFA] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <a
            href={`/api/discovery/export?collectionId=${collection.id}&format=json`}
            download
            className="px-3.5 py-1.5 bg-[#111113] hover:bg-[#27272A] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] rounded-md text-xs transition-colors"
          >
            Export JSON
          </a>
        </div>
      </div>

      {/* Collection Title Panel */}
      <div className="p-6 bg-[#111113] border border-[#27272A] rounded-lg">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
              <Folder className="w-6 h-6 text-[#2563EB]" />
              <span>
                {collection.keywords && collection.keywords.length > 0
                  ? collection.keywords.join(', ')
                  : collection.keyword}
              </span>
            </h1>
            <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5 mt-2">
              <MapPin className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>
                {collection.locations && collection.locations.length > 0
                  ? collection.locations.join(', ')
                  : collection.location}
              </span>
              <span>•</span>
              <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${statusColors}`}>
              {collection.status}
            </span>
            {collection.status === 'RUNNING' && (
              <p className="text-[10px] text-[#2563EB] animate-pulse">Scraper job is running in background...</p>
            )}
          </div>
        </div>

        {/* Goal completion display */}
        <div className="mt-6 p-4 bg-[#09090B] border border-[#27272A] rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#A1A1AA]">Campaign Lead Extraction Progress:</span>
                <span className="font-mono text-[#FAFAFA]">
                  {collection.leadCount} / {collection.targetCount} Leads
                </span>
              </div>
              <div className="w-full bg-[#27272A] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 md:border-l md:border-[#27272A] md:pl-6 text-[11px] text-[#A1A1AA]">
              <div>
                <p className="font-bold">Completion</p>
                <p className="font-mono font-bold text-sm text-[#FAFAFA] mt-0.5">
                  {completionPercent}%
                </p>
              </div>
              <div>
                <p className="font-bold">Target Leads</p>
                <p className="font-mono font-bold text-sm text-[#FAFAFA] mt-0.5">
                  {collection.targetCount}
                </p>
              </div>
              <div>
                <p className="font-bold">Est. Available</p>
                <p className="font-mono font-bold text-sm text-[#FAFAFA] mt-0.5">
                  {collection.estimatedAvailable}
                </p>
              </div>
              <div>
                <p className="font-bold">Saturation Status</p>
                <p className="font-mono font-semibold text-xs text-[#F59E0B] mt-0.5">
                  {collection.saturationStatus}
                </p>
              </div>
            </div>
          </div>

          {collection.status === 'RUNNING' && (
            <div className="mt-4 pt-3 border-t border-[#1b1b1f] text-xs text-[#A1A1AA] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                <span>
                  Currently scraping: <strong className="text-[#FAFAFA]">"{collection.currentKeyword}"</strong> in{' '}
                  <strong className="text-[#FAFAFA]">"{collection.currentLocation}"</strong>
                </span>
              </div>
              <div className="font-mono text-[10px] space-x-3">
                <span>Processed: {collection.totalProcessed}</span>
                <span>•</span>
                <span>Audited: {collection.businessesAudited}</span>
                <span>•</span>
                <span>Failed: {collection.businessesFailed}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Quality Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-[#111113] border border-[#27272A] rounded-lg text-center">
          <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Reachable Leads</p>
          <p className="font-mono text-xl font-bold text-[#22C55E] mt-1">{collection.reachableLeads}</p>
        </div>
        <div className="p-4 bg-[#111113] border border-[#27272A] rounded-lg text-center">
          <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Verified Websites</p>
          <p className="font-mono text-xl font-bold text-[#FAFAFA] mt-1">{collection.verifiedWebsites}</p>
        </div>
        <div className="p-4 bg-[#111113] border border-[#27272A] rounded-lg text-center">
          <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Owners Found</p>
          <p className="font-mono text-xl font-bold text-[#FAFAFA] mt-1">{collection.ownersFound}</p>
        </div>
        <div className="p-4 bg-[#111113] border border-[#27272A] rounded-lg text-center">
          <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Social profiles</p>
          <p className="font-mono text-xl font-bold text-[#FAFAFA] mt-1">{collection.socialProfilesFound}</p>
        </div>
        <div className="p-4 bg-[#111113] border border-[#27272A] rounded-lg text-center">
          <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Avg Lead Score</p>
          <p className="font-mono text-xl font-bold text-[#2563EB] mt-1">
            {hasIntel ? `${collection.avgLeadScore} pts` : '—'}
          </p>
        </div>
        <div className="p-4 bg-[#111113] border border-[#27272A] rounded-lg text-center">
          <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Avg Sales Readiness</p>
          <p className="font-mono text-xl font-bold text-[#F59E0B] mt-1">
            {hasIntel ? `${collection.avgSalesReadiness}%` : '—'}
          </p>
        </div>
      </div>

      {/* Directory Section */}
      <div className="p-6 bg-[#111113] border border-[#27272A] rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#FAFAFA]">Collection Leads Directory</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Showing {filteredBusinesses.length} of {collection.businesses?.length || 0} leads extracted in this collection
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#A1A1AA]" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#09090B] border border-[#27272A] rounded px-3 py-1.5 pl-8 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#2563EB] w-48"
              />
            </div>

            {/* Filter selectors */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-[#09090B] border border-[#27272A] rounded px-2 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Tiers</option>
              <option value="A+">Tier A+</option>
              <option value="A">Tier A</option>
              <option value="B+">Tier B+</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
            </select>

            <select
              value={readinessFilter}
              onChange={(e) => setReadinessFilter(e.target.value)}
              className="bg-[#09090B] border border-[#27272A] rounded px-2 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Readiness</option>
              <option value="A+">Readiness A+</option>
              <option value="A">Readiness A</option>
              <option value="B">Readiness B</option>
              <option value="C">Readiness C</option>
              <option value="D">Readiness D</option>
            </select>
          </div>
        </div>

        {actionMessage && (
          <div className="mb-4 p-3 bg-[#2563EB]/15 border border-[#2563EB]/35 text-[#FAFAFA] rounded text-xs">
            {actionMessage}
          </div>
        )}

        <div className="overflow-x-auto">
          {filteredBusinesses.length === 0 ? (
            <p className="text-sm text-[#A1A1AA] py-8 text-center border-t border-[#27272A]">
              No leads match the selected filters.
            </p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-[#A1A1AA] font-bold">
                  <th className="pb-3">Business Name</th>
                  <th className="pb-3 text-center">Rating</th>
                  <th className="pb-3 text-center">Reviews</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Website</th>
                  <th className="pb-3 text-center">Lead Score</th>
                  <th className="pb-3 text-center">Sales Readiness</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1b1e]">
                {filteredBusinesses.map((biz) => {
                  const hasIntel = !!biz.leadIntelligence;
                  const leadScore = biz.leadIntelligence?.leadScore ?? '—';
                  const leadTier = biz.leadIntelligence?.leadTier ?? '';
                  const readiness =
                    biz.leadIntelligence?.salesReadinessScore !== null &&
                    biz.leadIntelligence?.salesReadinessScore !== undefined
                      ? `${biz.leadIntelligence.salesReadinessScore}/100`
                      : '—';
                  const isActioning = actioningId === biz.id;

                  return (
                    <tr key={biz.id} className="hover:bg-[#1b1b1f]/50">
                      <td className="py-3.5">
                        <div className="font-bold text-[#FAFAFA]">{biz.name}</div>
                        <div className="text-[10px] text-[#A1A1AA] mt-0.5">
                          {biz.industry || 'Unknown'} • {biz.city || 'Delhi'}
                        </div>
                      </td>
                      <td className="py-3.5 text-center font-mono font-semibold text-[#FAFAFA]">
                        {biz.rating !== null ? `${biz.rating} ★` : '—'}
                      </td>
                      <td className="py-3.5 text-center font-mono text-[#FAFAFA]">
                        {biz.reviewCount !== null ? biz.reviewCount : '—'}
                      </td>
                      <td className="py-3.5 font-mono text-[#A1A1AA]">{biz.phone || '—'}</td>
                      <td className="py-3.5 max-w-[120px] truncate text-[#A1A1AA]">
                        {biz.website ? (
                          <a
                            href={biz.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-[#2563EB] flex items-center gap-1"
                          >
                            Visit <ExternalLink className="w-3 h-3 inline shrink-0" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {hasIntel ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-mono font-bold text-[#FAFAFA]">{leadScore}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[#2563EB]/15 text-[#2563EB] text-[9px] font-bold">
                              {leadTier}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {hasIntel ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              biz.leadIntelligence?.salesReadinessScore &&
                              biz.leadIntelligence.salesReadinessScore >= 80
                                ? 'bg-[#22C55E]/15 text-[#22C55E]'
                                : biz.leadIntelligence?.salesReadinessScore &&
                                  biz.leadIntelligence.salesReadinessScore >= 60
                                ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                                : 'bg-[#EF4444]/15 text-[#EF4444]'
                            }`}
                          >
                            {readiness}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 text-right space-x-1.5 shrink-0">
                        <Link
                          href={`/business/${biz.id}`}
                          className="px-2 py-1 bg-[#27272A] hover:bg-[#27272A]/80 text-[#FAFAFA] rounded font-medium text-[11px] transition-colors"
                        >
                          Open
                        </Link>
                        <button
                          onClick={() => handleRunAudit(biz.id)}
                          disabled={isActioning || !biz.website}
                          className="px-2 py-1 bg-[#F59E0B] hover:bg-[#F59E0B]/80 disabled:bg-[#F59E0B]/30 disabled:text-[#A1A1AA] text-black font-semibold rounded text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Audit
                        </button>
                        <button
                          onClick={() => handleCreateDeal(biz.id)}
                          disabled={isActioning}
                          className="px-2 py-1 bg-[#22C55E] hover:bg-[#22C55E]/80 disabled:bg-[#22C55E]/30 text-black font-semibold rounded text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <Briefcase className="w-3.5 h-3.5" /> Deal
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
