import {
  Memory,
  MemoryBuilder,
  MemoryItem,
} from "../../developer-api/index.js";

type MemoryBuilderImplMessageDatum<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> = {
  type: "builder-datum-utterance";
  func: (data: Params) => string | undefined | null;
  role: Role;
  name?: string;
} | MemoryItem<Role, ToolName>;

export class MemoryBuilderImpl<
  Params extends Record<string, any>,
  Role extends string,
  ToolName extends string,
> implements MemoryBuilder<Params, Role, ToolName>
{
  private memoryData: (
    | MemoryBuilderImplMessageDatum<Params, Role, ToolName>
  )[];

  constructor() {
    this.memoryData = [];
  }

  toolCall(toolName: ToolName, args: string, toolCallId: string): MemoryBuilder<Params, Role, ToolName> {
    this.memoryData.push({
      type: 'tool-call',
      arguments: args,
      toolName,
      toolCallId,
    });
    return this;
  }

  toolCallResult(toolCallId: string, result: string | null): MemoryBuilder<Params, Role, ToolName> {
    this.memoryData.push({
      type: 'tool-call-result',
      toolCallId,
      result,
    });
    return this;
  }

  append(memoryItems: MemoryItem<Role, ToolName>[]): MemoryBuilder<Params, Role, ToolName> {
    this.memoryData.push(...memoryItems);
    return this;
  }

  utterance(
    role: Role,
    nameOrMessageBuilderFunction: string | ((data: Params) => string | undefined | null),
    messageBuilderFunction?: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role, ToolName> {
    const isNameProvided = typeof nameOrMessageBuilderFunction === "string";

    if (isNameProvided) {
      if (messageBuilderFunction === undefined) {
        throw new Error("Message builder function must be provided when name is specified.");
      }
      this.memoryData.push({
        type: "builder-datum-utterance",
        func: messageBuilderFunction,
        role,
        name: nameOrMessageBuilderFunction,
      });
    } else {
      this.memoryData.push({
        type: "builder-datum-utterance",
        func: nameOrMessageBuilderFunction,
        role,
      });
    }
    return this;
  }

  build(data: Params): Memory<Role, ToolName> {
    const contents = this.memoryData
      .map((datum) => {
        if (datum.type === 'builder-datum-utterance') {
          const itemContents = datum.func(data);
          return itemContents !== null && itemContents !== undefined
            ? ({
                type: "utterance",
                role: datum.role,
                contents: itemContents,
                ...(datum.name !== undefined && datum.name !== '' && { name: datum.name }),
              } as MemoryItem<Role, ToolName>)
            : null;
        } else {
          return datum;
        }
      })
      .filter((itemOrNull) => itemOrNull !== null);
    return {
      type: "memory",
      contents,
    };
  }
}
