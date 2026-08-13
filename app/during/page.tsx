import { ComingSoon } from "@/components/shell/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      icon="pulse"
      eyebrow="During Appointment"
      title="Real-time support in the room"
      blurb="Capture what's said, follow along in your language, and keep track of what still needs answering."
      planned={["Live transcription", "Translation support", "Smart note-taking", "Key points & remaining questions"]}
    />
  );
}
