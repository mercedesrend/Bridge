import { ComingSoon } from "@/components/shell/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      icon="target"
      eyebrow="Treatment Options"
      title="Understand your options"
      blurb="Compare treatments discussed with your care team, with sourced explanations in plain language."
      planned={["Sourced treatment explanations", "Benefits and trade-offs side by side", "Questions to ask about each option", "Save options to revisit later"]}
    />
  );
}
