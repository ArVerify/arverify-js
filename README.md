<p align="center">
  <img src="https://github.com/ArVerify/arverify-js/raw/main/img/hero.svg" height=200 />
</p>

[![Version](https://img.shields.io/npm/v/arverify?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/arverify)

## Installation

- `yarn add arverify`
- `npm install arverify`

## Usage

### Getting address information

```js
import { getVerification } from "arverify";

const address = "...";
const verification = await getVerification(address);
// returns an object containing:
// verified: Boolean
// txID: String | undefined
// icon: String
// percentage: number
```

Basic-Example:

```js
const address = "...";
const verification = await getVerification(address);

// to check if an address is verified you can use
if (verification.verified) {
  console.log("Address is verified");
  console.log("Verification tx:", verification.txID);
  console.log("Trust score is:", verification.percentage);
}
```

### Verifying addresses

```js
import { verify } from "arverify";

const address = "...";
const returnUri = "https://your-application.com";

// optional: pass in your own address to be eligible to receive
// ARVERIFY Tokens as a reward
const referral = "[your address]";

const uri = verify(address, returnUri, referral);
// redirect the user to this uri
```
