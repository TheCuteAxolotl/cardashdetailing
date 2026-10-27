import assert from "node:assert/strict";
import {connectionFailure} from "../src/lib/gmail-connection-error";
assert.equal(connectionFailure("inbox",{authenticationFailed:true,response:"secret"}).reason,"authentication");
assert.match(connectionFailure("sending",{code:"EAUTH"}).message,/exact Google account/);
assert.equal(connectionFailure("inbox",{code:"ETIMEDOUT"}).reason,"network");
assert.match(connectionFailure("saving",{}).message,/accepted/);
assert.match(connectionFailure("encryption",{}).message,/server configuration/);
assert.ok(!connectionFailure("inbox",{code:"unknown",response:"sensitive",message:"secret"}).message.includes("secret"));
console.log("Gmail stage diagnostics distinguish authentication, network, encryption, and persistence without exposing provider data.");
