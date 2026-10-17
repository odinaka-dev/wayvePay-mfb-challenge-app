import { StatusView } from "@/components/shared/status-view";

export default function ScanScreen() {
  return (
    <StatusView
      edges={["top"]}
      icon="scan"
      title="Scan & Pay"
      message="Scan a QR code to send money instantly."
    />
  );
}
