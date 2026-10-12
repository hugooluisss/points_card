import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { Clock } from "../ledger/clock";
import {
  RegistrationPageDto,
  RegistrationPass,
  RegisterCustomerRequest,
  RegisterCustomerResponse,
} from "@points-card/shared";
import { RegistrationRepository } from "./registration.repository";
import { RateLimiter } from "./rate-limiter";
import { Inject } from "@nestjs/common";
import {
  WALLET_PASS_PROVIDER,
  WalletPassProvider,
} from "../wallet-pass/wallet-pass-provider";
import { RECOVERY_NOTIFIER, RecoveryNotifier } from "./recovery-notifier";
import { PlanLimitsService } from "../billing/plan-limits.service";
import { BillingAccessService } from "../billing/billing-access.service";

@Injectable()
export class PublicRegistrationService {
  constructor(
    private readonly registrations: RegistrationRepository,
    private readonly limiter: RateLimiter,
    private readonly clock: Clock,
    private readonly config: ConfigService,
    @Inject(WALLET_PASS_PROVIDER) private readonly wallet: WalletPassProvider,
    @Inject(RECOVERY_NOTIFIER) private readonly notifier: RecoveryNotifier,
    private readonly limits: PlanLimitsService,
    private readonly billingAccess: BillingAccessService,
  ) {}
  private genericNotFound() {
    return new NotFoundException("No encontramos este comercio.");
  }
  async page(publicCode: string): Promise<RegistrationPageDto> {
    const business = await this.registrations.byPublicCode(publicCode);
    if (!business) throw this.genericNotFound();
    const notice = await this.registrations.currentNotice(business.id);
    return {
      businessName: business.name,
      brandColor: business.brandColor,
      logoUrl: business.logoUrl,
      fields: business.registrationFields as RegistrationPageDto["fields"],
      privacyNotice: { version: notice.version, text: notice.text },
    };
  }
  async register(
    publicCode: string,
    request: RegisterCustomerRequest,
    ip: string,
  ): Promise<RegisterCustomerResponse> {
    const business = await this.registrations.byPublicCode(publicCode);
    if (!business) throw this.genericNotFound();
    const now = this.clock.now().getTime();
    this.limiter.assertAllowed(`${ip}|${publicCode}`, now);
    if (request.website)
      return {
        existing: false,
        message: "Tu tarjeta está lista para guardarse en Wallet.",
        passes: [
          {
            platform: "google",
            saveUrl: "https://google.wallet.example/save/demo",
          },
          {
            platform: "apple",
            saveUrl: "https://apple.wallet.example/save/demo",
          },
        ],
      };
    if (
      !Number.isFinite(request.startedAt) ||
      now - request.startedAt < 2000 ||
      now - request.startedAt > 86_400_000
    )
      throw new BadRequestException("No se pudo completar el registro.");
    if (!request.acceptPrivacy)
      throw new BadRequestException("Debes aceptar el aviso de privacidad.");
    const values = {
      name: request.name?.trim(),
      email: request.email?.trim().toLowerCase() || undefined,
      phone: request.phone?.replace(/\D/g, ""),
      birthday: request.birthday,
    };
    const fields = business.registrationFields as {
      key: string;
      required: boolean;
    }[];
    if (
      fields.some(({ key, required }) => {
        const value = values[key as keyof typeof values];
        return required && (!value || !value.trim());
      })
    )
      throw new BadRequestException("Completa los campos obligatorios.");
    if (!values.name)
      throw new BadRequestException("El nombre es obligatorio.");
    if (!values.email && !values.phone)
      throw new BadRequestException("Indica un correo o teléfono.");
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      throw new BadRequestException("El correo no es válido.");
    if (values.phone && !/^\d{10,15}$/.test(values.phone))
      throw new BadRequestException(
        "El teléfono debe tener entre 10 y 15 dígitos.",
      );
    if (
      values.birthday &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthday) ||
        Number.isNaN(Date.parse(`${values.birthday}T00:00:00Z`)) ||
        new Date(`${values.birthday}T00:00:00Z`).toISOString().slice(0, 10) !==
          values.birthday ||
        values.birthday > this.clock.now().toISOString().slice(0, 10))
    )
      throw new BadRequestException("La fecha de nacimiento no es válida.");
    const duplicate = await this.registrations.customerByContact(
      business.id,
      values.email ?? null,
      values.phone ?? null,
    );
    if (duplicate) {
      const raw = randomBytes(32).toString("base64url");
      const secret =
        this.config.get<string>("JWT_REFRESH_SECRET") ??
        "development-recovery-secret";
      const tokenHash = createHmac("sha256", secret).update(raw).digest("hex");
      const expires = new Date(now + 30 * 60_000);
      await this.registrations.createRecoveryToken({
        id: randomUUID(),
        businessId: business.id,
        customerId: duplicate.id,
        tokenHash,
        expiresAt: expires,
        usedAt: null,
      });
      const destination = duplicate.email ?? duplicate.phone ?? "";
      await this.notifier.send(
        destination,
        `${this.config.get("PUBLIC_WEB_URL") || "https://agents-dev.hugosantiago.dev/points-card-app"}/recover/${raw}`,
      );
      return {
        existing: true,
        message:
          "Si ya tienes una tarjeta, te enviamos un enlace para recuperarla.",
        passes: [],
      };
    }
    const programs = await this.registrations.activePrograms(business.id);
    if (!programs.length)
      throw new ConflictException(
        "Este comercio aún no tiene un programa activo.",
      );
    await this.billingAccess.assertWritable(business.id);
    await this.limits.assertCanCreate("cards", programs.length, business.id);
    const notice = await this.registrations.currentNotice(business.id);
    const manageRaw = request.acceptMarketing
      ? randomBytes(32).toString("base64url")
      : null;
    const manageHash = manageRaw
      ? createHmac(
          "sha256",
          this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        )
          .update(manageRaw)
          .digest("hex")
      : null;
    const created = await this.registrations.registerWithPasses({
      businessId: business.id,
      name: values.name,
      email: values.email ?? null,
      phone: values.phone ?? null,
      birthday: values.birthday ?? null,
      noticeVersion: notice.version,
      marketing: request.acceptMarketing,
      programIds: programs.map(({ id }) => id),
      manageTokenHash: manageHash,
    });
    const passes: RegistrationPass[] = [];
    for (const account of created.accounts)
      passes.push(
        ...(await this.wallet.issue(business.id, account.id, account.cardCode)),
      );
    if (manageRaw) {
      const destination = values.email ?? values.phone ?? "";
      await this.notifier.send(
        destination,
        `${this.config.get("PUBLIC_WEB_URL") || "https://agents-dev.hugosantiago.dev/points-card-app"}/consent/revoke/${manageRaw}`,
      );
    }
    return {
      existing: false,
      message: "Tu tarjeta está lista para guardarse en Wallet.",
      passes,
    };
  }
  async revokeMarketing(raw: string) {
    const hash = createHmac(
      "sha256",
      this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
    )
      .update(raw)
      .digest("hex");
    if (!(await this.registrations.revokeMarketingByToken(hash)))
      throw new NotFoundException("El enlace no es válido o ya fue utilizado.");
    return {
      revoked: true,
      message: "Tu consentimiento para promociones fue revocado.",
    };
  }
}
