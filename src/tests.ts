import {
  getVerification,
  getNodes,
  Threshold,
  getScore,
  getStake,
  getFee,
  recommendNode,
  selectTokenHolder,
} from ".";
import { assert } from "chai";

describe("Testing core functions", () => {
  it("Should get the stake for an address", (done) => {
    getStake("cMM3SKregpSdGFhlMEEsU1nxeWFKAkKOCFaom4nKh7U").then((stake) => {
      assert(stake);
      done();
    });
  });
  it("Should find active nodes", (done) => {
    getNodes()
      .then((nodes) => {
        assert(nodes);
        assert(nodes.length);
      })
      .catch((err) => {
        // thorws an error when no nodes are online
        assert(err);
      })
      .finally(() => {
        done();
      });
  });
  it("Should get the node fee", (done) => {
    getFee().then((fee) => {
      assert(fee);
      done();
    });
  });
  it("Should recommend a node", (done) => {
    recommendNode().then((node) => {
      assert(node);
      getNodes().then((nodes) => {
        // check if recommended node in all nodes
        assert(nodes.indexOf(node) > -1);
        done();
      });
    });
  });
  it("Should select a token holder", (done) => {
    selectTokenHolder().then((address) => {
      assert(address);
      done();
    });
  });
});

describe("Trust Tests", function () {
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
