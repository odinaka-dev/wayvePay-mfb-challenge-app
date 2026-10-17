import { StatusView } from "@/components/shared/status-view";

export default function MessagesScreen() {
  return (
    <StatusView
      edges={["top"]}
      icon="chatFill"
      title="No messages yet"
      message="Conversations with support and contacts will show up here."
    />
  );
}
