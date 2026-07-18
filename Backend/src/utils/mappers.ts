import { User } from "@prisma/client";
import { PublicUser } from "../types/auth.types";

export const mapUserToPublicUser = (user: User): PublicUser => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName,
    phone: user.phone,
    profileImage: user.profileImage,
    companyName: user.companyName,
    productCategory: user.productCategory,
    gstNumber: user.gstNumber,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
};
