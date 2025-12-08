import { hashSync, compareSync } from 'bcryptjs';

export function hashPassword(password: string) {
    return hashSync(password, 10);
}

export function comparePassword(password: string, hash: string) {
    return compareSync(password, hash);
}
