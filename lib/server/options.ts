import { XMLParser } from "fast-xml-parser";
import { PatientProfile, SourceChip, TreatmentOption } from "@/lib/types";
import { rewriteOption } from "@/lib/server/llm";
import { slugify } from "@/lib/utils";

type OpenFdaResult = {
  id?: string;
  set_id?: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
  };
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
};

type TrialStudy = {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    statusModule?: {
      overallStatus?: string;
    };
    designModule?: {
      phases?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        name?: string;
      }>;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
      }>;
    };
  };
};

function trimSentence(value: string | undefined) {
  if (!value) {
    return "";
  }
  return value.replace(/\s+/g, " ").trim();
}

function maybeSourceChip(kind: SourceChip["kind"], label: string, href: string): SourceChip {
  return { kind, label, href };
}

async function fetchOpenFda(profile: PatientProfile) {
  const url = new URL("https://api.fda.gov/drug/label.json");
  url.searchParams.set("search", `indications_and_usage:"${profile.condition}"`);
  url.searchParams.set("limit", "10");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("openFDA lookup failed");
  }

  const data = (await response.json()) as { results?: OpenFdaResult[] };
  return data.results ?? [];
}

async function fetchTrials(profile: PatientProfile) {
  const url = new URL("https://clinicaltrials.gov/api/v2/studies");
  url.searchParams.set("query.cond", profile.condition);
  url.searchParams.set("filter.overallStatus", "RECRUITING,ACTIVE_NOT_RECRUITING");
  url.searchParams.set(
    "fields",
    [
      "protocolSection.identificationModule.nctId",
      "protocolSection.identificationModule.briefTitle",
      "protocolSection.descriptionModule.briefSummary",
      "protocolSection.statusModule.overallStatus",
      "protocolSection.designModule.phases",
      "protocolSection.armsInterventionsModule.interventions",
      "protocolSection.contactsLocationsModule.locations"
    ].join(",")
  );
  url.searchParams.set("pageSize", "25");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("ClinicalTrials.gov lookup failed");
  }

  const data = (await response.json()) as { studies?: TrialStudy[] };
  return data.studies ?? [];
}

async function fetchMedline(profile: PatientProfile) {
  const url = new URL("https://wsearch.nlm.nih.gov/ws/query");
  url.searchParams.set("db", "healthTopics");
  url.searchParams.set("term", profile.condition);
  url.searchParams.set("retmax", "5");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("MedlinePlus lookup failed");
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ""
  });
  return parser.parse(xml) as Record<string, unknown>;
}

function buildMedlineOverview(parsed: Record<string, unknown>) {
  const list = (parsed.nlmSearchResult as { list?: { document?: unknown } } | undefined)?.list;
  const documents = Array.isArray(list?.document)
    ? list?.document
    : list?.document
      ? [list.document]
      : [];

  const first = documents[0] as
    | {
        content?: Array<{ name?: string; text?: string }> | { name?: string; text?: string };
        url?: string;
        title?: string;
      }
    | undefined;

  if (!first) {
    return null;
  }

  const contents = Array.isArray(first.content) ? first.content : first.content ? [first.content] : [];
  const summaryNode = contents.find((entry) => entry.name === "FullSummary") ?? contents[0];
  const summary = trimSentence(summaryNode?.text).slice(0, 320);

  return {
    title: first.title ?? "MedlinePlus overview",
    summary,
    href: first.url ?? "https://medlineplus.gov/",
    chip: maybeSourceChip("medline", "MedlinePlus", first.url ?? "https://medlineplus.gov/")
  };
}

async function toPlainLanguageOptions(
  options: Array<
    Omit<TreatmentOption, "plainName" | "whatItIs" | "howItsGiven" | "whyItMightComeUp" | "questionsToAsk">
  >,
  profile: PatientProfile
) {
  const results = await Promise.allSettled(
    options.map(async (option) => {
      const rewrite = await rewriteOption({
        sourceText: option.sourceText,
        sourceTitle: option.sourceTitle,
        profile
      });

      if (!rewrite.whatItIs) {
        return null;
      }

      return {
        ...option,
        ...rewrite
      } satisfies TreatmentOption;
    })
  );

  return results.flatMap((result) => {
    if (result.status === "fulfilled" && result.value) {
      return [result.value];
    }
    return [];
  });
}

export async function retrieveOptions(profile: PatientProfile) {
  const [openFdaResult, trialsResult, medlineResult] = await Promise.allSettled([
    fetchOpenFda(profile),
    fetchTrials(profile),
    fetchMedline(profile)
  ]);

  const overview =
    medlineResult.status === "fulfilled" ? buildMedlineOverview(medlineResult.value) : null;

  const standardRaw =
    openFdaResult.status === "fulfilled"
      ? openFdaResult.value.map((result) => {
          const brand = result.openfda?.brand_name?.[0] ?? result.openfda?.generic_name?.[0] ?? "Treatment";
          const generic = result.openfda?.generic_name?.[0];
          const sourceTitle = generic && generic !== brand ? `${brand} (${generic})` : brand;
          const sourceText = [
            trimSentence(result.indications_and_usage?.[0]),
            trimSentence(result.dosage_and_administration?.[0])
          ]
            .filter(Boolean)
            .join(" ");
          const recordId = result.set_id ?? result.id ?? sourceTitle;

          return {
            id: slugify(`standard-${recordId}`),
            category: "standard" as const,
            sourceTitle,
            sourceText,
            chips: [
              maybeSourceChip(
                "openfda",
                "openFDA label",
                `https://api.fda.gov/drug/label.json?search=set_id:%22${encodeURIComponent(recordId)}%22&limit=1`
              )
            ]
          };
        })
      : [];

  const trialsRaw =
    trialsResult.status === "fulfilled"
      ? trialsResult.value.flatMap((study) => {
          const nctId = study.protocolSection?.identificationModule?.nctId;
          const title = study.protocolSection?.identificationModule?.briefTitle;
          const summary = trimSentence(study.protocolSection?.descriptionModule?.briefSummary);
          const status = study.protocolSection?.statusModule?.overallStatus ?? "";
          const phases = study.protocolSection?.designModule?.phases ?? [];
          const interventions = study.protocolSection?.armsInterventionsModule?.interventions ?? [];
          const locations = study.protocolSection?.contactsLocationsModule?.locations ?? [];
          const locationLine = locations
            .slice(0, 2)
            .map((location) => [location.facility, location.city, location.state].filter(Boolean).join(", "))
            .filter(Boolean)
            .join(" | ");
          const interventionNames = interventions.map((item) => item.name).filter(Boolean).join(", ");

          if (!nctId || !title) {
            return [];
          }

          const category =
            status === "RECRUITING"
              ? ("trials-now" as const)
              : status === "ACTIVE_NOT_RECRUITING" && phases.includes("PHASE3")
                ? ("coming-soon" as const)
                : null;

          if (!category) {
            return [];
          }

          return [
            {
              id: slugify(`trial-${nctId}`),
              category,
              sourceTitle: title,
              sourceText: [summary, interventionNames, locationLine].filter(Boolean).join(" "),
              chips: [
                maybeSourceChip("trial", "NCT record", `https://clinicaltrials.gov/study/${nctId}`)
              ]
            }
          ];
        })
      : [];

  const options = await toPlainLanguageOptions([...standardRaw, ...trialsRaw], profile);

  return {
    overview,
    sections: {
      standard: options.filter((option) => option.category === "standard"),
      "trials-now": options.filter((option) => option.category === "trials-now"),
      "coming-soon": options.filter((option) => option.category === "coming-soon")
    }
  };
}
