import SayItNow from "@/components/SayItNow";
import AuthGate from "@/components/AuthGate";

export default function Home() {
  return (
    <AuthGate>
      <SayItNow />
    </AuthGate>
  );
}
