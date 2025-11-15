import { describe, it, expect, beforeEach } from "vitest";
import { DeleteUserUseCase } from "~/modules/user/application/use-cases/delete-user.use-case";
import { MockUserRepository } from "../../../../helpers/mock-helper";
import { TestFactory } from "../../../../helpers/test-factory";

describe("DeleteUserUseCase", () => {
  let repo: MockUserRepository;
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    repo = new MockUserRepository();
    useCase = new DeleteUserUseCase(repo as any);
  });

  it("存在しないIDはエラー", async () => {
    await expect(useCase.execute("x", "current")).rejects.toThrow(
      "ユーザーが見つかりません",
    );
  });

  it("自分自身は削除できない", async () => {
    const u = TestFactory.createUser({ id: "me" });
    repo.setUsers([u]);

    await expect(useCase.execute("me", "me")).rejects.toThrow(
      "自分自身を削除することはできません",
    );
  });

  it("別ユーザーは削除できる", async () => {
    const u = TestFactory.createUser({ id: "target" });
    repo.setUsers([u]);

    await useCase.execute("target", "me");

    const left = await repo.findAll();
    expect(left).toHaveLength(0);
  });
});
