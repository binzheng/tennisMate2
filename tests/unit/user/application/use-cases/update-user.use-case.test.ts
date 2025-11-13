import { describe, it, expect, beforeEach } from "vitest";
import { UpdateUserUseCase } from "~/modules/user/application/use-cases/update-user.use-case";
import { MockUserRepository } from "../../../../helpers/mock-helper";
import { TestFactory } from "../../../../helpers/test-factory";

describe("UpdateUserUseCase", () => {
  let repo: MockUserRepository;
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    repo = new MockUserRepository();
    useCase = new UpdateUserUseCase(repo as any);
  });

  it("存在しないユーザーはエラー", async () => {
    await expect(
      useCase.execute("unknown", { name: "X" }),
    ).rejects.toThrow("ユーザーが見つかりません");
  });

  it("基本項目の更新ができる (userId/name/email/role)", async () => {
    const user = TestFactory.createUser({ userId: "u1", email: "a@ex.com" });
    repo.setUsers([user]);

    const dto = {
      userId: "u2",
      name: "Updated",
      email: "b@ex.com",
      role: "coach" as const,
    };
    const out = await useCase.execute(user.id, dto);

    expect(out.userId).toBe("u2");
    expect(out.name).toBe("Updated");
    expect(out.email).toBe("b@ex.com");
    expect(out.role).toBe("coach");
  });

  it("userIdの重複でエラー", async () => {
    const u1 = TestFactory.createUser({ id: "1", userId: "dup" });
    const u2 = TestFactory.createUser({ id: "2", userId: "other" });
    repo.setUsers([u1, u2]);

    await expect(
      useCase.execute("2", { userId: "dup" }),
    ).rejects.toThrow("このユーザーIDは既に使用されています");
  });

  it("emailの重複でエラー", async () => {
    const u1 = TestFactory.createUser({ id: "1", email: "e@ex.com" });
    const u2 = TestFactory.createUser({ id: "2", email: "b@ex.com" });
    repo.setUsers([u1, u2]);

    await expect(
      useCase.execute("2", { email: "e@ex.com" }),
    ).rejects.toThrow("このメールアドレスは既に使用されています");
  });

  it("パスワード指定時はハッシュが更新される", async () => {
    const user = TestFactory.createUser({ userId: "u1" });
    repo.setUsers([user]);

    const beforeHash = user.passwordHash;
    const out = await useCase.execute(user.id, { password: "newpassword" });

    // DTOには hash は含まれない
    expect(out).not.toHaveProperty("passwordHash");

    // リポジトリ内部のユーザーが更新されていることを確認
    const saved = await repo.findById(user.id);
    expect(saved?.passwordHash).toBeTruthy();
    expect(saved?.passwordHash).not.toBe(beforeHash);
  });

  it("同じuserId/emailを指定しただけなら重複判定しない", async () => {
    const user = TestFactory.createUser({ userId: "u1", email: "a@ex.com" });
    repo.setUsers([user]);

    const out = await useCase.execute(user.id, {
      userId: "u1",
      email: "a@ex.com",
    });
    expect(out.userId).toBe("u1");
    expect(out.email).toBe("a@ex.com");
  });
});
