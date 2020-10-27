import { isVerified } from ".";
import { assert } from "chai";

describe("E2E Tests", function () {
  it("Check verified address.", (done) => {
    isVerified("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO8").then(
      (verified) => {
        assert(verified === true);
        done();
      }
    );
  });
  it("Check not verified address.", (done) => {
    isVerified("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO9").then(
      (verified) => {
        assert(verified === false);
        done();
      }
    );
  });
});
