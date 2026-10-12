import { BadRequestException } from "@nestjs/common";
import { RegistrationSettingsService } from "./registration-settings.service";

describe("registration settings", () => {
  it("requires name and one contact field", async () => {
    const repository = { updateSettings: jest.fn(), settings: jest.fn() };
    const service = new RegistrationSettingsService(
      repository as never,
      { get: () => undefined } as never,
    );
    await expect(
      service.update({
        fields: [{ key: "email", required: true }],
        brandColor: null,
        logoUrl: null,
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateSettings).not.toHaveBeenCalled();
  });
});
