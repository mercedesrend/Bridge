import { researchLive, settings } from "./config";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const CTGOV = "https://clinicaltrials.gov/api/v2/studies";

type Paper = {
  id: string;
  source: string;
  title: string;
  journal: string;
  year: string;
  authors: string[];
  publication_types: string[];
  url: string;
};

type Trial = {
  id: string;
  source: string;
  title: string;
  status: string;
  phases: string[];
  study_type: string;
  interventions: string[];
  summary: string;
  locations: string[];
  total_locations: number;
  url: string;
};

function ncbiParams(extra: Record<string, string>) {
  const params = new URLSearchParams({
    tool: "bridge",
    email: settings.contactEmail,
    ...extra,
  });
  if (settings.ncbiApiKey) params.set("api_key", settings.ncbiApiKey);
  return params;
}

async function searchPubmed(query: string): Promise<Paper[]> {
  const limit = String(settings.maxStudies);
  try {
    const search = await fetch(
      `${EUTILS}/esearch.fcgi?${ncbiParams({
        db: "pubmed",
        term: query,
        retmax: limit,
        retmode: "json",
        sort: "relevance",
      })}`,
      { signal: AbortSignal.timeout(settings.requestTimeout * 1000) },
    );
    if (!search.ok) return [];
    const ids: string[] = (await search.json())?.esearchresult?.idlist || [];
    if (!ids.length) return [];
    const summary = await fetch(
      `${EUTILS}/esummary.fcgi?${ncbiParams({
        db: "pubmed",
        id: ids.join(","),
        retmode: "json",
      })}`,
      { signal: AbortSignal.timeout(settings.requestTimeout * 1000) },
    );
    if (!summary.ok) return [];
    const result = (await summary.json())?.result || {};
    return ids.flatMap((pmid) => {
      const item = result[pmid];
      if (!item) return [];
      return [
        {
          id: pmid,
          source: "PubMed",
          title: String(item.title || "").replace(/\.$/, ""),
          journal: item.fulljournalname || item.source || "",
          year: String(item.pubdate || "").slice(0, 4),
          authors: (item.authors || []).map((a: { name?: string }) => a.name || "").slice(0, 3),
          publication_types: item.pubtype || [],
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        },
      ];
    });
  } catch {
    return [];
  }
}

async function searchTrials(condition: string): Promise<Trial[]> {
  const params = new URLSearchParams({
    "query.cond": condition,
    pageSize: String(settings.maxStudies),
    format: "json",
    fields:
      "NCTId|BriefTitle|OverallStatus|Phase|StudyType|Condition|InterventionName|InterventionType|LocationCity|LocationState|LocationCountry|BriefSummary|MinimumAge|MaximumAge|EligibilityCriteria",
    "filter.overallStatus": "RECRUITING",
  });
  try {
    const resp = await fetch(`${CTGOV}?${params}`, {
      signal: AbortSignal.timeout(settings.requestTimeout * 1000),
    });
    if (!resp.ok) return [];
    const studies = (await resp.json())?.studies || [];
    return studies.map((study: Record<string, unknown>) => {
      const protocol = (study.protocolSection || {}) as Record<string, Record<string, unknown>>;
      const ident = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const arms = protocol.armsInterventionsModule || {};
      const locations = ((protocol.contactsLocationsModule || {}).locations || []) as Record<string, string>[];
      const desc = protocol.descriptionModule || {};
      const nct = String(ident.nctId || "");
      return {
        id: nct,
        source: "ClinicalTrials.gov",
        title: String(ident.briefTitle || ""),
        status: String(status.overallStatus || ""),
        phases: (design.phases || []) as string[],
        study_type: String(design.studyType || ""),
        interventions: ((arms.interventions || []) as { name?: string }[])
          .map((i) => i.name || "")
          .filter(Boolean)
          .slice(0, 5),
        summary: String(desc.briefSummary || "").slice(0, 900),
        locations: locations
          .slice(0, 4)
          .map((loc) => [loc.city, loc.state, loc.country].filter(Boolean).join(", ")),
        total_locations: locations.length,
        url: `https://clinicaltrials.gov/study/${nct}`,
      };
    });
  } catch {
    return [];
  }
}

export async function gatherEvidence(condition: string) {
  if (!researchLive()) return { papers: [] as Paper[], trials: [] as Trial[] };
  let papers = await searchPubmed(
    `${condition} AND (treatment OR therapy) AND (review[pt] OR guideline[pt])`,
  );
  if (!papers.length) papers = await searchPubmed(`${condition} treatment`);
  const trials = await searchTrials(condition);
  return { papers, trials };
}
