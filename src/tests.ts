import { isVerified, icon } from ".";
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
  it("Check verified icon.", (done) => {
    icon("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO8").then((verifiedIcon) => {
      assert(verifiedIcon);
      done();
    });
  });
  it("Check unverified address.", (done) => {
    isVerified("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO9").then(
      (verified) => {
        assert(verified === false);
        done();
      }
    );
  });
  it("Check unverified icon.", (done) => {
    icon("-yREnOSjHwqtLQ-ZmorCDj-9LH0jHpeGxV8nh60ziO9").then(
      (unverifiedIcon) => {
        assert(unverifiedIcon);
        done();
      }
    );
  });
});
