import bcrypt from "bcryptjs";

const password = "Zackcat12";
const hash = await bcrypt.hash(password, 10);
console.log("Password:", password);
console.log("Hash:", hash);
