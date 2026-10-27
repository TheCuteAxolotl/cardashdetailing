import assert from "node:assert/strict";
import {encryptEmailSecret,decryptEmailSecret,emailRecipient,matchesSecret,secretHash} from "../src/lib/gmail-security";
process.env.EMAIL_ENCRYPTION_KEY="test-encryption-key-over-24-characters";
const password="abcdefghijklmnop",encrypted=encryptEmailSecret(password);
assert.equal(decryptEmailSecret(encrypted),password);
assert.ok(!encrypted.includes(password));
assert.notEqual(encryptEmailSecret(password),encrypted);
const parts=encrypted.split(".");parts[2]=Buffer.from("tampered").toString("base64");
assert.throws(()=>decryptEmailSecret(parts.join(".")));
assert.equal(emailRecipient(" client@example.com "),"client@example.com");
for(const bad of ["client@example.com\r\nBcc: evil@example.com","a@example.com,b@example.com","Name <a@example.com>","missing"]){assert.throws(()=>emailRecipient(bad));}
assert.ok(matchesSecret("token",secretHash("token")));
assert.ok(!matchesSecret("wrong",secretHash("token")));
console.log("Credential encryption, tamper rejection, recipient validation, and scheduler token verification passed.");
