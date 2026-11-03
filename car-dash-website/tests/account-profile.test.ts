import assert from "node:assert/strict";
import { EMPTY_ACCOUNT_PROFILE, normalizeAccountProfile, decodeStoredProfile, formatSavedAddress } from "../src/lib/account-profile";

const address={id:"addr_12345",label:"Home",line1:"123 Main St",line2:"Suite 2",
 city:"South Elgin",state:"IL",postalCode:"60177",instructions:"Driveway"};
const profile={...EMPTY_ACCOUNT_PROFILE,phone:"(630) 555-0123",
 addresses:[address],defaultAddressId:address.id};
assert.deepEqual(normalizeAccountProfile(profile),profile);
assert.deepEqual(decodeStoredProfile(JSON.stringify(profile)),profile);
assert.equal(formatSavedAddress(address),"123 Main St, Suite 2, South Elgin, IL 60177");
assert.equal(normalizeAccountProfile({...profile,addresses:[{...address,line1:""}]}),null);
assert.equal(normalizeAccountProfile({...profile,defaultAddressId:"somebody_elses_address"}),null);
assert.equal(normalizeAccountProfile({...profile,addresses:[address,address]}),null);
assert.equal(normalizeAccountProfile({...profile,avatar:"data:image/svg+xml,<svg onload=alert(1)>"}),null);
assert.equal(normalizeAccountProfile({...profile,phone:"1 <script>alert('x')</script>"}),null);
assert.deepEqual(decodeStoredProfile("{broken"),EMPTY_ACCOUNT_PROFILE);
console.log("Profile validation rejects unsafe images, invalid contact data, duplicate addresses and invalid defaults.");
