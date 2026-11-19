import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Hash fixo usado quando o usuário não existe: mantém o tempo de resposta
// constante e evita enumeração de e-mails por timing.
const DUMMY_HASH = "$2b$12$BB5SVRPGsPl2vuMwkTfa8.cTI2SS/lJFGuXcK.6Xkp8J76SvI1viK";
export async function fakeVerify(): Promise<false> {
  await bcrypt.compare("dummy-password", DUMMY_HASH);
  return false;
}
