import { ComingSoon } from "@/components/shell/ComingSoon";

export default function QuestionsPage() {
  return (
    <ComingSoon
      icon="chat"
      eyebrow="Clinical Trials"
      title="Questions for your care team"
      blurb="A consolidated, shareable list of the questions raised across every trial you matched against."
      planned={[
        "Questions aggregated across all matched trials",
        "Grouped by trial, with the criterion that raised each one",
        "Shareable link that carries the list, no account needed",
        "Printable one-page version for the appointment",
      ]}
    />
  );
}
