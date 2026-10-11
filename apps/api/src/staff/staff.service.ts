import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { AuthUser, Role } from "@points-card/shared";
import { StaffRepository } from "./staff.repository";

@Injectable()
export class StaffService {
  constructor(private readonly staff: StaffRepository) {}
  list() {
    return this.staff.list();
  }
  async create(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    branchIds: string[] | null;
  }) {
    if (
      input.branchIds &&
      (await this.staff.validBranchIds(input.branchIds)).length !==
        new Set(input.branchIds).size
    )
      throw new BadRequestException(
        "Una o más sucursales no pertenecen a este comercio.",
      );
    try {
      const staff = await this.staff.createStaff({
        ...input,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash: await argon2.hash(input.password),
      });
      const { passwordHash: _passwordHash, ...safe } = staff;
      return safe;
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY")
        throw new ConflictException(
          "No fue posible crear el usuario con esos datos.",
        );
      throw error;
    }
  }
  async setActive(id: string, active: boolean) {
    return this.change(id, { isActive: active });
  }
  async setRole(id: string, role: Role) {
    return this.change(id, { role });
  }
  private async change(
    id: string,
    values: { isActive?: boolean; role?: Role },
  ) {
    const target = await this.staff.byId(id);
    if (!target) throw new NotFoundException("Usuario no encontrado.");
    if (
      target.isActive &&
      target.role === Role.Owner &&
      ((values.role !== undefined && values.role !== Role.Owner) ||
        values.isActive === false) &&
      (await this.staff.activeOwnerCount()) <= 1
    )
      throw new BadRequestException(
        "No se puede desactivar o cambiar el rol del último owner activo.",
      );
    await this.staff.updateStaff(id, values);
    return { id, ...values };
  }
}
