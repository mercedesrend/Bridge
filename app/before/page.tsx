import { ComingSoon } from "@/components/shell/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      icon="calendar"
      eyebrow="Before Appointment"
      title="Prepare with confidence"
      blurb="Organize your symptoms, understand possible conditions, and walk in with the questions that matter most to you."
      planned={["Describe symptoms in your own words", "Possible conditions to discuss", "Auto-generated questions to ask", "What to expect during the visit"]}
    />
  );
}
