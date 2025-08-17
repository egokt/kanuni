export type RoleDefault = "user" | "assistant";

export type UtteranceRoleDefaults = "user" | "assistant";

export type Utterance<ActorRole extends string> = {
  type: 'utterance';
  role: ActorRole;
  name?: string;
  contents: string;
};

export type ToolCall<ToolName extends string> = {
  type: 'tool-call';
  toolName: ToolName;
  arguments: string;
  toolCallId: string;
};

export type ToolCallResult = {
  type: 'tool-call-result';
  toolCallId: string;
  result: string | null;
}

export type MemoryItem<Role extends string, ToolName extends string> =
  | Utterance<Role>
  | ToolCall<ToolName>
  | ToolCallResult;

export type Memory<Role extends string, ToolName extends string> = {
  type: 'memory';
  contents: MemoryItem<Role, ToolName>[];
};
