import { Body, Controller, Post } from "@nestjs/common";
import { RegisterBusinessRequest } from "./dto/register-business.dto";
import { BusinessesService } from "./businesses.service";
import { Public } from "../auth/public.decorator";

@Controller("businesses")
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Public()
  @Post("register")
  register(@Body() body: RegisterBusinessRequest) {
    return this.businesses.register(body);
  }
}
