import { getVerification, getNodes, Threshold } from ".";
import { getScore } from "./trust";
import { assert } from "chai";

describe("E2E Tests", function () {
  it("Check verified address.", (done) => {
    getVerification("s-hGrOFm1YysWGC3wXkNaFVpyrjdinVpRKiVnhbo2so").then(
      (res) => {
        assert(res.verified);
        assert(res.icon);
        done();
      }
    );
  });
  it("Should fail a threshold check.", (done) => {
    getVerification(
      "s-hGrOFm1YysWGC3wXkNaFVpyrjdinVpRKiVnhbo2so",
      Threshold.ULTRA
    ).then((res) => {
      assert(!res.verified);
      assert(res.icon);
      done();
    });
  });
  it("Check unverified address.", (done) => {
    getVerification("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO9").then(
      (res) => {
        assert(!res.verified);
        assert(res.icon);
        done();
      }
    );
  });
  it("Check retrieval of nodes.", (done) => {
    getNodes().then((nodes) => {
      assert(nodes);
      done();
    });
  });
});

describe("Testing trust score", () => {
  it("Should get the score for an address", (done) => {
    getScore("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO8").then((res) => {
      assert(res);
      done();
    });
  });
  it("Should have a higher score for a different address", (done) => {
    getScore("s-hGrOFm1YysWGC3wXkNaFVpyrjdinVpRKiVnhbo2so").then((res) => {
      assert(res);
      assert(res.percentage > 0.8);
      done();
    });
  });
});
