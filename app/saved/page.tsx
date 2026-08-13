import { ComingSoon } from "@/components/shell/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      icon="bookmark"
      eyebrow="Saved & Notes"
      title="Everything in one place"
      blurb="Your saved trials, treatment options, questions, and personal notes, kept together."
      planned={["Saved clinical trials", "Saved treatment options", "Your question lists", "Personal notes and reminders"]}
    />
  );
}
