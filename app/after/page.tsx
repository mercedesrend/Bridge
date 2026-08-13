import { ComingSoon } from "@/components/shell/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      icon="clock"
      eyebrow="After Appointment"
      title="Review and take action"
      blurb="Turn a rushed appointment into a clear plan you can actually follow."
      planned={["Plain-language appointment summary", "Treatment options discussed", "Where to go next", "When to seek a second opinion"]}
    />
  );
}
