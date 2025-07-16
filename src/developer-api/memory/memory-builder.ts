export type RoleDefault = 'user' | 'assistant';

export type MemoryBuilderFunction<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault,
> = (
  builder: MemoryBuilder<Params, Role>,
) => MemoryBuilder<Params, Role> | undefined | null;

export interface MemoryBuilder<
  Params extends Record<string, any> = {},
  Role extends string = RoleDefault
> {
  message(
    role: Role,
    messageBuilderFunction: (data: Params) => string | undefined | null,
  ): MemoryBuilder<Params, Role>;
}
