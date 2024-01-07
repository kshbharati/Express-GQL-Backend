import bcrypt from "bcrypt";

export async function hashPass(pass: string) {
    const saltRounds = 10;
    const salt = await bcrypt.genSaltSync(saltRounds);
    const hash = await bcrypt.hashSync(pass, salt);
    return hash;
}

export async function comparePass(pass: string, hashedPass: string) {
    return await bcrypt.compareSync(pass, hashedPass);
}
