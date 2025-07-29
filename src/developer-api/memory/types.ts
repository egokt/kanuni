export type RoleDefault = "user" | "assistant";

export type UtteranceRoleDefaults = "user" | "assistant";

export type Utterance<ActorRole extends string = UtteranceRoleDefaults> = {
  type: "utterance";
  role: ActorRole;
  name?: string;
  contents: string;
};

export type MemoryItem<Role extends string = RoleDefault> =
  Utterance<Role>;

export type Memory<Role extends string = RoleDefault> = {
  type: "memory";
  contents: MemoryItem<Role>[];
};
