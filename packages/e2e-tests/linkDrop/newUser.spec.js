const { test, expect } = require("@playwright/test");
const { BN } = require("bn.js");
const { parseNearAmount, formatNearAmount } = require("near-api-js/lib/utils/format");
const { KeyPairEd25519 } = require("near-api-js/lib/utils/key_pair");

const { CreateAccountPage } = require("../register/models/CreateAccount");
const { HomePage } = require("../register/models/Home");
const { SetRecoveryOptionPage } = require("../register/models/SetRecoveryOption");
const { VerifySeedPhrasePage } = require("../register/models/VerifySeedPhrase");
const nearApiJsConnection = require("../utils/connectionSingleton");
const { generateTestAccountId, getBankAccount } = require("../utils/account");
const { LinkDropPage } = require("./models/LinkDrop");
const { SetupSeedPhrasePage } = require("../register/models/SetupSeedPhrase");
const { fetchLinkdropContract } = require("../contracts");
const { WALLET_NETWORK } = require("../constants");

const { describe, beforeAll, afterAll } = test;

describe("Linkdrop flow", () => {
    let linkdropSenderAccount,
        linkdropReceiverAccount,
        linkdropContractAccount,
        linkdropKeyPair,
        linkdropTransferNEARAmount = "2.5";

    const LINKDROP_ACCESS_KEY_ALLOWANCE = new BN(parseNearAmount("1.0"));
    const linkdropClaimableAmount = new BN(parseNearAmount(linkdropTransferNEARAmount)).sub(LINKDROP_ACCESS_KEY_ALLOWANCE);

    beforeAll(async () => {
        const bankAccount = await getBankAccount();
        [linkdropSenderAccount, linkdropContractAccount, linkdropReceiverAccount] = [
            bankAccount.spawnRandomSubAccountInstance(),
            bankAccount.spawnRandomSubAccountInstance(),
            bankAccount.spawnRandomSubAccountInstance(),
        ];
        // Create random accounts for linkdrop sender, receiver and contract account and deploy linkdrop contract to the contract account
        // The random accounts are created as subaccounts of BANK_ACCOUNT
        // fail the test suite at this point if one of the accounts fails to create
        await Promise.all([
            linkdropSenderAccount.create({ amount: "7.0" }),
            fetchLinkdropContract().then((contractWasm) => linkdropContractAccount.create({ amount: "5.0", contractWasm })),
            linkdropReceiverAccount.create(),
        ]).catch((e) => {
            throw new Error("Cannot run test suite, linkdrop sender, receiver and contract accounts not successfully created", {
                cause: e,
            });
        });
        linkdropKeyPair = KeyPairEd25519.fromRandom();
        // send linkdropTransferNEARAmount Ⓝ to contract
        await linkdropSenderAccount.nearApiJsAccount.functionCall(
            linkdropContractAccount.accountId,
            "send",
            { public_key: linkdropKeyPair.publicKey.toString() },
            null,
            new BN(parseNearAmount(linkdropTransferNEARAmount))
        );
    });

    afterAll(async () => {
        await Promise.allSettled([
            linkdropSenderAccount.delete(),
            linkdropReceiverAccount.delete(),
            linkdropContractAccount.delete(),
        ]);
    });

    test("logs in and claims linkdrop", async ({ page }) => {
        const linkdropPage = new LinkDropPage(page);

        await linkdropPage.navigate(linkdropContractAccount.accountId, linkdropKeyPair.secretKey);
        await expect(page).not.toHaveSelector(".dots");
        await linkdropPage.loginAndClaim();

        await page.click(`data-test-id=recoverAccountWithPassphraseButton`);
        await page.fill("data-test-id=seedPhraseRecoveryInput", linkdropReceiverAccount.seedPhrase);
        await page.click(`[type="submit"]`);
        await page.waitForNavigation();
        await linkdropPage.claimToExistingAccount();
        await page.waitForNavigation();

        await expect(page).toMatchURL(/\/$/);
        await page.reload();
        await expect(page).not.toHaveSelector(".dots");
        const nearBalance = await new HomePage(page).getNearBalanceInNear();
        await expect(new BN(parseNearAmount(nearBalance)).gte(linkdropClaimableAmount)).toBe(true);
    });
    test("claims linkdrop to new account", async ({ page, context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(test.skip);
        // skip test on mainnet
        if (nearApiJsConnection.config.networkId === WALLET_NETWORK.MAINNET) {
            test.skip();
        }

        linkdropKeyPair = KeyPairEd25519.fromRandom();
        const linkdropContractTLAAccountId = "testnet";

        await linkdropSenderAccount.nearApiJsAccount.functionCall(
            linkdropContractTLAAccountId,
            "send",
            { public_key: linkdropKeyPair.publicKey.toString() },
            null,
            new BN(parseNearAmount(linkdropTransferNEARAmount))
        );
        const linkdropPage = new LinkDropPage(page);
        await linkdropPage.navigate(linkdropContractTLAAccountId, linkdropKeyPair.secretKey);
        await linkdropPage.createAccountToClaim();

        const createAccountPage = new CreateAccountPage(page);
        await createAccountPage.acceptTerms();
        await createAccountPage.submitAccountId(generateTestAccountId());
        
        const setRecoveryOptionPage = new SetRecoveryOptionPage(page);
        await setRecoveryOptionPage.clickSeedPhraseRecoveryOption();
        await setRecoveryOptionPage.submitRecoveryOption();
        
        const setupSeedPhrasePage = new SetupSeedPhrasePage(page);
        const copiedSeedPhrase = await setupSeedPhrasePage.copySeedPhrase();
        await setupSeedPhrasePage.continueToSeedPhraseVerification();
        
        const verifySeedPhrasePage = new VerifySeedPhrasePage(page);
        const requestedVerificationWordNumber = await verifySeedPhrasePage.getRequestedVerificationWordNumber();
        await verifySeedPhrasePage.verifyWithWord(copiedSeedPhrase.split(" ")[requestedVerificationWordNumber - 1]);

        await expect(page).toMatchURL(/\/$/);
        await expect(page).toHaveSelector("data-test-id=linkDropSuccessModal");
    });
});
