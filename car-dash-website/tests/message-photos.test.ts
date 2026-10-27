import assert from "node:assert/strict";
import {messagePhotos} from "../src/lib/message-photos";
assert.deepEqual(messagePhotos(undefined),[]);
assert.deepEqual(messagePhotos(['data:image/jpeg;base64,YWJj']),['data:image/jpeg;base64,YWJj']);
for(const value of [['data:image/svg+xml;base64,YWJj'],['https://example.com/image.jpg'],Array(4).fill('data:image/png;base64,YWJj'),['data:image/png;base64,'+'A'.repeat(650001)]])assert.throws(()=>messagePhotos(value));
console.log('Photo attachments: allow supported inline images; reject SVG, external URLs, oversize files and too many photos.');
