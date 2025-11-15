import { describe, it, expect, beforeEach } from "vitest";
import { GetUserByIdUseCase } from "~/modules/user/application/use-cases/get-user-by-id.use-case";
import { MockUserRepository } from "../../../../helpers/mock-helper";
import { TestFactory } from "../../../../helpers/test-factory";

describe("GetUserByIdUseCase", () => {
  let repo: MockUserRepository;
  let useCase: GetUserByIdUseCase;

  beforeEach(() => {
    repo = new MockUserRepository();
    useCase = new GetUserByIdUseCase(repo as any);
  });

  it("IDでユーザーを取得できる", async () => {
    const user = TestFactory.createUser();
    repo.setUsers([user]);

    const dto = await useCase.execute(user.id);
    expect(dto.id).toBe(user.id);
    expect(dto.userId).toBe(user.userId);
    expect(dto).not.toHaveProperty("passwordHash");
  });

  it("見つからない場合はエラー", async () => {
    await expect(useCase.execute("not-found")).rejects.toThrow(
      "ユーザーが見つかりません",
    );
  });
});
