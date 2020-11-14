import { isVerified, getNodes } from ".";
import { assert } from "chai";

describe("E2E Tests", function () {
  it("Check verified address.", (done) => {
    isVerified("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO8").then((res) => {
      assert(res.verified);
      assert(res.icon);
      done();
    });
  });
  it("Check unverified address.", (done) => {
    isVerified("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO9").then((res) => {
      assert(!res.verified);
      assert(res.icon);
      done();
    });
  });
  it("Check retrieval of nodes.", (done) => {
    getNodes().then((nodes) => {
      assert(nodes);
      done();
    });
  });
});
