import { MemoryItem } from "./types.js";

export type MemoryBuilderFunction<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> = (
  builder: MemoryBuilder<Params, Role, ToolName>,
) => MemoryBuilder<Params, Role, ToolName> | undefined | null;

export interface MemoryBuilder<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> {
  utterance(
    role: Role,
    messageBuilderFunction: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role, ToolName>;
  utterance(
    role: Role,
    name: string,
    messageBuilderFunction: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role, ToolName>;

  toolCall(
    toolName: ToolName,
    args: string,
    toolCallId: string,
  ): MemoryBuilder<Params, Role, ToolName>;

  toolCallResult(
    toolCallId: string,
    result: string | null,
  ): MemoryBuilder<Params, Role, ToolName>;

  /**
   * Appends existing memory items to the builder.
   * 
   * **Important**: The appended items will share object references with the originals
   * for performance reasons. Do not modify the original memory items after appending,
   * as changes will be reflected in the built memory.
   * 
   * @param memoryItems Array of memory items to append
   * @returns The builder instance for method chaining
   */
  append(
    memoryItems: MemoryItem<Role, ToolName>[],
  ): MemoryBuilder<Params, Role, ToolName>;
}
