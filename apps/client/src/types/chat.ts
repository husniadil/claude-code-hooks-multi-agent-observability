// Shape of a single content block inside an assistant/user message.
// Claude transcripts mix several block kinds (text, thinking, tool_use,
// tool_result, …); fields are optional because each kind only sets its own.
export interface ChatContentBlock {
  type?: string;
  text?: string;
  thinking?: string;
  signature?: string;
  name?: string;
  input?: unknown;
  content?: unknown;
}

export interface ChatMessage {
  role?: string;
  content?: string | ChatContentBlock[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

// A single rendered transcript entry. Most fields are optional because the
// transcript stores user/assistant/system entries plus assorted metadata.
export interface ChatItem {
  type?: string;
  role?: string;
  content?: string;
  message?: ChatMessage;
  timestamp?: string;
  uuid?: string;
  sessionId?: string;
  toolUseID?: string;
  toolUseResult?: unknown;
  isMeta?: boolean;
}
