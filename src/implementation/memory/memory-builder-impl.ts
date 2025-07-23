import {
  Memory,
  MemoryBuilder,
  MemoryItem,
  RoleDefault,
} from "../../developer-api/index.js";

type MemoryBuilderImplMessageDatum<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault,
> = {
  type: "utterance";
  func: (data: Params) => string | undefined | null;
  role: Role;
  name?: string;
};

export class MemoryBuilderImpl<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault,
> implements MemoryBuilder<Params, Role>
{
  private memoryData: MemoryBuilderImplMessageDatum<Params, Role>[];

  constructor() {
    this.memoryData = [];
  }

  utterance(
    role: Role,
    nameOrMessageBuilderFunction: string | ((data: Params) => string | undefined | null),
    messageBuilderFunction?: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role> {
    const isNameProvided = typeof nameOrMessageBuilderFunction === "string";

    if (isNameProvided) {
      if (messageBuilderFunction === undefined) {
        throw new Error("Message builder function must be provided when name is specified.");
      }
      this.memoryData.push({
        type: "utterance",
        func: messageBuilderFunction,
        role,
        name: nameOrMessageBuilderFunction,
      });
    } else {
      this.memoryData.push({
        type: "utterance",
        func: nameOrMessageBuilderFunction,
        role,
      });
    }
    return this;
  }

  build(data: Params): Memory {
    const contents = this.memoryData
      .map((datum) => {
        const itemContents = datum.func(data);
        return itemContents !== null && itemContents !== undefined
          ? ({
              type: "utterance",
              role: datum.role,
              contents: itemContents,
              ...(datum.name !== undefined && datum.name !== '' && { name: datum.name }),
            } as MemoryItem)
          : null;
      })
      .filter((itemOrNull) => itemOrNull !== null);
    return {
      type: "memory",
      contents,
    };
  }
}
