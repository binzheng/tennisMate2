import { describe, it, expect, beforeEach } from "vitest";
import { GetUsersUseCase } from "~/modules/user/application/use-cases/get-users.use-case";
import { MockUserRepository } from "../../../../helpers/mock-helper";
import { TestFactory } from "../../../../helpers/test-factory";

describe("GetUsersUseCase", () => {
  let repo: MockUserRepository;
  let useCase: GetUsersUseCase;

  beforeEach(() => {
    repo = new MockUserRepository();
    useCase = new GetUsersUseCase(repo as any);
  });

  it("全ユーザーをDTO配列で返す", async () => {
    const u1 = TestFactory.createUser();
    const u2 = TestFactory.createUser();
    repo.setUsers([u1, u2]);

    const out = await useCase.execute();
    expect(out).toHaveLength(2);
    expect(out[0]?.id).toBe(u1.id);
    expect(out[1]?.id).toBe(u2.id);
    expect(out[0]).not.toHaveProperty("passwordHash");
  });
});
