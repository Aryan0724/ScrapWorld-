'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Search,
  Building,
  MapPin,
  Filter,
  DollarSign,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileDown,
  Briefcase,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface Lead {
  id: string;
  businessId: string;
  leadScore: number;
  leadTier: string;
  urgencyScore: number;
  buyerProbability: number;
  estimatedDealValue: number;
  leadPriorityRank: number;
  salesReadinessScore: number | null;
  salesReadinessTier: string | null;
  reachabilityScore: number | null;
  contactabilityTier: string | null;
  closingProbability: number | null;
  business: {
    name: string;
    city: string | null;
    industry: string | null;
    phone: string | null;
    website: string | null;
    verifiedWebsite: string | null;
    websiteConfidence: number | null;
    websiteSource: string | null;
    ownerName: string | null;
    opportunities: Array<{ serviceType: string }>;
    socialProfiles: Array<{ platform: string }>;
  };
}

export default function LeadsPage() {
  // Query / Filter state
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [tier, setTier] = useState('');
  const [readiness, setReadiness] = useState('');
  const [reachability, setReachability] = useState('');
  const [minDealValue, setMinDealValue] = useState('');
  const [sort, setSort] = useState('leadPriorityRank');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        city,
        industry,
        tier,
        readiness,
        reachability,
        minDealValue: minDealValue || '0',
        sort,
        order,
        limit: '100', // Retrieve top 100 for Operations
        offset: '0',
      });
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [city, industry, tier, readiness, reachability, minDealValue, sort, order]);

  // Handle manual search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  // Toggle sort order
  const handleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('desc'); // default to desc for scores
    }
  };

  // Row selection helpers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(leads.map(l => l.businessId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (businessId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, businessId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== businessId));
    }
  };

  // Bulk Action: Create Deals
  const handleBulkCreateDeals = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setBulkMessage('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-deals',
          businessIds: selectedIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBulkMessage(`Bulk action complete: ${data.message}`);
        setSelectedIds([]);
      } else {
        setBulkMessage(data.error || 'Failed to trigger bulk deal creation.');
      }
    } catch (e: any) {
      setBulkMessage('Error running bulk action: ' + e.message);
    } finally {
      setBulkLoading(false);
      setTimeout(() => setBulkMessage(''), 8000);
    }
  };

  // Bulk Action: Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;

    // Header row
    const headers = [
      'Rank',
      'Business Name',
      'Lead Score',
      'Tier',
      'Reachability Score',
      'Contactability Tier',
      'Buyer Probability',
      'Closing Probability',
      'Sales Readiness Score',
      'Sales Readiness Tier',
      'Deal Value',
      'Industry',
      'City',
      'Phone',
      'Verified Website',
      'Recommended Services',
    ];

    // Data rows
    const rows = leads.map(l => [
      l.leadPriorityRank,
      `"${l.business.name.replace(/"/g, '""')}"`,
      l.leadScore,
      l.leadTier,
      l.reachabilityScore ?? 'N/A',
      l.contactabilityTier ?? 'N/A',
      l.buyerProbability,
      l.closingProbability ?? 'N/A',
      l.salesReadinessScore ?? 'N/A',
      l.salesReadinessTier ?? 'N/A',
      l.estimatedDealValue,
      l.business.industry ? `"${l.business.industry.replace(/"/g, '""')}"` : 'N/A',
      l.business.city ?? 'N/A',
      l.business.phone ?? 'N/A',
      l.business.verifiedWebsite ?? 'None',
      l.business.opportunities.map(o => o.serviceType).join('; ') || 'None',
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scrape_world_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#2563EB]" />
            <span>Top Lead Intelligence</span>
          </h1>
          <p className="text-[#A1A1AA] mt-1 text-sm">
            Hardened and validated local leads ranked by digital need, suitability, and contactability.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="px-4 py-2 bg-[#27272A] hover:bg-[#27272A]/80 disabled:opacity-50 text-[#FAFAFA] rounded-md text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleBulkCreateDeals}
            disabled={selectedIds.length === 0 || bulkLoading}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#2563EB]/80 disabled:opacity-50 text-[#FAFAFA] rounded-md text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            {bulkLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Briefcase className="w-4 h-4" />
            )}
            <span>Create Deals ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {bulkMessage && (
        <div className="p-3 bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#FAFAFA] rounded text-xs">
          {bulkMessage}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-5 bg-[#111113] border border-[#27272A] rounded-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search business name or industry keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-md py-2 pl-10 pr-4 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#2563EB]/80 text-[#FAFAFA] font-bold rounded-md text-xs transition-colors shrink-0"
          >
            Apply Search
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Industry Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase mb-1 flex items-center gap-1">
              <Building className="w-3 h-3" /> Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] rounded p-2 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Industries</option>
              <option value="clinic">Clinics</option>
              <option value="salon">Salons</option>
              <option value="gym">Gyms</option>
              <option value="restaurant">Restaurants</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] rounded p-2 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Cities</option>
              <option value="Delhi">Delhi</option>
              <option value="New Delhi">New Delhi</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase mb-1 flex items-center gap-1">
              <Star className="w-3 h-3" /> Lead Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] rounded p-2 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Tiers</option>
              <option value="A+">A+ Priority</option>
              <option value="A">A High</option>
              <option value="B+">B+ Medium</option>
              <option value="B">B Standard</option>
              <option value="C">C Low</option>
            </select>
          </div>

          {/* Sales Readiness */}
          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Readiness
            </label>
            <select
              value={readiness}
              onChange={(e) => setReadiness(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] rounded p-2 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Readiness</option>
              <option value="A+">A+ High Urgency</option>
              <option value="A">A High Interest</option>
              <option value="B">B Ready</option>
              <option value="C">C Medium</option>
              <option value="D">D Cold</option>
            </select>
          </div>

          {/* Reachability */}
          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase mb-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Contactability
            </label>
            <select
              value={reachability}
              onChange={(e) => setReachability(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] rounded p-2 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">All Reachable</option>
              <option value="HOT">HOT (Immediate)</option>
              <option value="WARM">WARM (Contactable)</option>
              <option value="COLD">COLD (No Email/Social)</option>
              <option value="UNREACHABLE">UNREACHABLE</option>
            </select>
          </div>

          {/* Min Deal Value */}
          <div>
            <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Min Deal Value
            </label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={minDealValue}
              onChange={(e) => setMinDealValue(e.target.value)}
              className="w-full bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] rounded p-2 focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="p-6 bg-[#111113] border border-[#27272A] rounded-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            <p className="text-xs text-[#A1A1AA]">Running pipeline scoring on database...</p>
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-[#A1A1AA] py-12 text-center">No leads matching selected filters found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-[#A1A1AA] font-bold">
                  <th className="pb-3 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === leads.length && leads.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-[#27272A] text-[#2563EB]"
                    />
                  </th>
                  <th className="pb-3 cursor-pointer select-none" onClick={() => handleSort('leadPriorityRank')}>
                    Rank {sort === 'leadPriorityRank' && (order === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="pb-3">Business Name</th>
                  <th className="pb-3 cursor-pointer select-none text-center" onClick={() => handleSort('leadScore')}>
                    Score {sort === 'leadScore' && (order === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="pb-3 text-center">Tier</th>
                  <th className="pb-3 cursor-pointer select-none text-center" onClick={() => handleSort('reachabilityScore')}>
                    Reachability {sort === 'reachabilityScore' && (order === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="pb-3 text-center">Buyer Prob.</th>
                  <th className="pb-3 text-center">Closing Prob.</th>
                  <th className="pb-3 cursor-pointer select-none text-center" onClick={() => handleSort('salesReadinessScore')}>
                    Readiness {sort === 'salesReadinessScore' && (order === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="pb-3 cursor-pointer select-none text-right" onClick={() => handleSort('estimatedDealValue')}>
                    Deal Value {sort === 'estimatedDealValue' && (order === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="pb-3">Rec. Service</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1b1e]">
                {leads.map((lead) => {
                  const biz = lead.business;
                  const isChecked = selectedIds.includes(lead.businessId);
                  const services = biz.opportunities.map(o => o.serviceType).join(', ') || 'N/A';

                  return (
                    <tr key={lead.id} className={`hover:bg-[#1b1b1f]/50 ${isChecked ? 'bg-[#2563EB]/5' : ''}`}>
                      <td className="py-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(lead.businessId, e.target.checked)}
                          className="rounded border-[#27272A] text-[#2563EB]"
                        />
                      </td>
                      <td className="py-4 font-mono text-[#FAFAFA]">#{lead.leadPriorityRank}</td>
                      <td className="py-4">
                        <div className="font-bold text-[#FAFAFA]">{biz.name}</div>
                        <div className="text-[10px] text-[#A1A1AA] flex items-center gap-1.5 mt-0.5">
                          <span>{biz.industry || 'Unknown'}</span>
                          <span>•</span>
                          <span>{biz.city || 'Delhi'}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center font-mono font-bold text-[#FAFAFA]">{lead.leadScore}</td>
                      <td className="py-4 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          lead.leadTier === 'A+' ? 'bg-yellow-500/15 text-yellow-500' :
                          lead.leadTier === 'A' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                          lead.leadTier.startsWith('B') ? 'bg-[#2563EB]/15 text-[#2563EB]' :
                          'bg-[#A1A1AA]/15 text-[#A1A1AA]'
                        }`}>
                          {lead.leadTier}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="font-mono text-[#FAFAFA]">{lead.reachabilityScore ?? 'N/A'}/100</div>
                        <div className="text-[9px] text-[#A1A1AA] mt-0.5">{lead.contactabilityTier}</div>
                      </td>
                      <td className="py-4 text-center font-mono text-[#FAFAFA]">{lead.buyerProbability}%</td>
                      <td className="py-4 text-center font-mono text-[#FAFAFA]">{lead.closingProbability ?? 0}%</td>
                      <td className="py-4 text-center">
                        <div className="font-mono text-[#FAFAFA]">{lead.salesReadinessScore ?? 'N/A'}/100</div>
                        <div className="text-[9px] text-[#A1A1AA] mt-0.5">{lead.salesReadinessTier}</div>
                      </td>
                      <td className="py-4 text-right font-mono font-semibold text-[#FAFAFA]">
                        ${lead.estimatedDealValue.toLocaleString()}
                      </td>
                      <td className="py-4 max-w-[120px] truncate text-[#A1A1AA]" title={services}>
                        {services}
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/business/${lead.businessId}`}
                          className="px-3 py-1 bg-[#2563EB] hover:bg-[#2563EB]/80 text-[#FAFAFA] font-medium rounded text-[11px] transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
