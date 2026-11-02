import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bookingInterval,
  chicagoClock,
  layoutTimeBlocks,
  shiftCalendarDate,
} from "../src/lib/team-calendar";
test("Chicago day and now marker use Chicago time across DST", () => {
  assert.deepEqual(chicagoClock(new Date("2026-11-02T02:00:00Z")), {
    date: "2026-11-01",
    minutes: 1200,
  });
  assert.deepEqual(chicagoClock(new Date("2026-07-02T02:00:00Z")), {
    date: "2026-07-01",
    minutes: 1260,
  });
});
test("parallel bookings are packed without hiding each other", () => {
  const r = layoutTimeBlocks([
    { id: "a", start: 540, end: 720 },
    { id: "b", start: 600, end: 660 },
    { id: "c", start: 660, end: 780 },
  ]);
  assert.equal(r.length, 3);
  assert.ok(r.every((e) => e.columns === 2 && e.conflict));
  assert.equal(r[1].column, r[2].column);
  assert.notEqual(r[0].column, r[1].column);
});
test("back-to-back bookings are not conflicts", () => {
  const r = layoutTimeBlocks([
    { id: "a", start: 540, end: 600 },
    { id: "b", start: 600, end: 660 },
  ]);
  assert.ok(r.every((e) => !e.conflict && e.columns === 1));
});
test("saved duration defines the timeline block", () => {
  const r = bookingInterval(
    {
      preferredDate: "2026-11-01",
      preferredTime: "9:30 AM",
      serviceName: "Full detail",
      notes: "Estimated duration minutes: 150",
    },
    "2026-11-01",
  );
  assert.equal(r?.start, 570);
  assert.equal(r?.end, 720);
});
test("overnight appointments remain visible on both dates", () => {
  const b = {
    preferredDate: "2026-11-01",
    preferredTime: "23:00",
    serviceName: "Detail",
    notes: "Estimated duration minutes: 180",
  };
  assert.equal(bookingInterval(b, "2026-11-01")?.carryOut, true);
  const next = bookingInterval(b, "2026-11-02");
  assert.equal(next?.start, 0);
  assert.equal(next?.end, 120);
  assert.equal(next?.carryIn, true);
  assert.equal(bookingInterval(b, "2026-11-03"), null);
});
test("missing times never become midnight appointments", () => {
  assert.equal(
    bookingInterval(
      {
        preferredDate: "2026-11-01",
        preferredTime: null,
        notes: null,
        serviceName: "Detail",
      },
      "2026-11-01",
    ),
    null,
  );
  assert.equal(shiftCalendarDate("2026-12-31", 1), "2027-01-01");
});

test("invalid stored dates are flagged rather than breaking the board", () => {
  assert.equal(
    bookingInterval(
      {
        preferredDate: "bad-date",
        preferredTime: "09:00",
        notes: null,
        serviceName: "Detail",
      },
      "2026-11-01",
    ),
    null,
  );
  assert.equal(
    bookingInterval(
      {
        preferredDate: "2026-02-30",
        preferredTime: "09:00",
        notes: null,
        serviceName: "Detail",
      },
      "2026-11-01",
    ),
    null,
  );
});
