export type Utterance<Role extends string = 'user' | 'assistant'> = {
  type: 'utterance';
  role: Role,
  contents: string;
}

export type MemoryItem<Role extends string = 'user' | 'assistant'> =
  | Utterance<Role>;

export type Memory<Role extends string = 'user' | 'assistant'> = {
  type: 'memory';
  contents: MemoryItem<Role>[];
}
