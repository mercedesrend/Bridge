import { ComingSoon } from "@/components/shell/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      icon="users"
      eyebrow="Second Opinions"
      title="Know when to ask"
      blurb="Getting another perspective is normal and often encouraged. Companion helps you decide when and how."
      planned={["When a second opinion helps", "How to request records", "Finding specialists near you", "Preparing for the consult"]}
    />
  );
}
