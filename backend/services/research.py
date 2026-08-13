"""Public research sources: PubMed (NCBI E-utilities) and ClinicalTrials.gov v2.

Both are free, public, and need no account. Everything returned here carries a
real URL so the UI can attach a source to every claim — the patient is never
asked to take our word for it.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from config import settings

log = logging.getLogger(__name__)

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
CTGOV = "https://clinicaltrials.gov/api/v2/studies"

PUBMED_URL = "https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
CTGOV_URL = "https://clinicaltrials.gov/study/{nct}"


def _ncbi_params(extra: dict[str, Any]) -> dict[str, Any]:
    params = {"tool": "bridge", "email": settings.contact_email, **extra}
    if settings.ncbi_api_key:
        params["api_key"] = settings.ncbi_api_key
    return params


async def search_pubmed(query: str, limit: int | None = None) -> list[dict]:
    """Return lightweight summaries of recent, relevant papers."""
    limit = limit or settings.max_studies
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            search = await client.get(
                f"{EUTILS}/esearch.fcgi",
                params=_ncbi_params(
                    {
                        "db": "pubmed",
                        "term": query,
                        "retmax": limit,
                        "retmode": "json",
                        "sort": "relevance",
                    }
                ),
            )
            search.raise_for_status()
            ids = search.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []

            summary = await client.get(
                f"{EUTILS}/esummary.fcgi",
                params=_ncbi_params(
                    {"db": "pubmed", "id": ",".join(ids), "retmode": "json"}
                ),
            )
            summary.raise_for_status()
            result = summary.json().get("result", {})

        papers = []
        for pmid in ids:
            item = result.get(pmid)
            if not item:
                continue
            authors = [a.get("name", "") for a in item.get("authors", [])][:3]
            papers.append(
                {
                    "id": pmid,
                    "source": "PubMed",
                    "title": item.get("title", "").rstrip("."),
                    "journal": item.get("fulljournalname") or item.get("source", ""),
                    "year": (item.get("pubdate", "") or "")[:4],
                    "authors": authors,
                    "publication_types": item.get("pubtype", []),
                    "url": PUBMED_URL.format(pmid=pmid),
                }
            )
        return papers

    except Exception as exc:  # noqa: BLE001
        log.warning("PubMed search failed for %r: %s", query, exc)
        return []


async def search_trials(
    condition: str, limit: int | None = None, recruiting_only: bool = True
) -> list[dict]:
    """Return actively recruiting trials for a condition."""
    limit = limit or settings.max_studies
    params: dict[str, Any] = {
        "query.cond": condition,
        "pageSize": limit,
        "format": "json",
        "fields": (
            "NCTId|BriefTitle|OverallStatus|Phase|StudyType|Condition|"
            "InterventionName|InterventionType|LocationCity|LocationState|"
            "LocationCountry|BriefSummary|MinimumAge|MaximumAge|EligibilityCriteria"
        ),
    }
    if recruiting_only:
        params["filter.overallStatus"] = "RECRUITING"

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            resp = await client.get(CTGOV, params=params)
            resp.raise_for_status()
            studies = resp.json().get("studies", [])
    except Exception as exc:  # noqa: BLE001
        log.warning("ClinicalTrials.gov search failed for %r: %s", condition, exc)
        return []

    out = []
    for study in studies:
        protocol = study.get("protocolSection", {})
        ident = protocol.get("identificationModule", {})
        status = protocol.get("statusModule", {})
        design = protocol.get("designModule", {})
        arms = protocol.get("armsInterventionsModule", {})
        locations = protocol.get("contactsLocationsModule", {}).get("locations", [])
        desc = protocol.get("descriptionModule", {})

        nct = ident.get("nctId", "")
        sites = [
            ", ".join(
                filter(None, [loc.get("city"), loc.get("state"), loc.get("country")])
            )
            for loc in locations[:4]
        ]
        out.append(
            {
                "id": nct,
                "source": "ClinicalTrials.gov",
                "title": ident.get("briefTitle", ""),
                "status": status.get("overallStatus", ""),
                "phases": design.get("phases", []),
                "study_type": design.get("studyType", ""),
                "interventions": [
                    i.get("name", "")
                    for i in arms.get("interventions", [])
                    if i.get("name")
                ][:5],
                "summary": (desc.get("briefSummary", "") or "")[:900],
                "locations": sites,
                "total_locations": len(locations),
                "url": CTGOV_URL.format(nct=nct),
            }
        )
    return out


async def gather_evidence(condition: str) -> dict:
    """One call that fetches everything the Before phase needs."""
    if not settings.research_live:
        # Scripted mode means zero outbound network — no waiting on timeouts.
        return {"papers": [], "trials": []}

    papers = await search_pubmed(
        f"{condition} AND (treatment OR therapy) AND (review[pt] OR guideline[pt])"
    )
    if not papers:
        papers = await search_pubmed(f"{condition} treatment")
    trials = await search_trials(condition)
    return {"papers": papers, "trials": trials}
