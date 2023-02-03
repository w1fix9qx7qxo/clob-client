import "mocha";
import { expect } from "chai";
import { UserOrder, Side, Chain, UserMarketOrder } from "../../src/types";
import {
    buildOrderCreationArgs,
    buildOrder,
    createOrder,
    buildMarketBuyOrderCreationArgs,
    createMarketBuyOrder,
    getOrderAmounts,
    getMarketBuyOrderRawAmounts,
} from "../../src/order-builder/helpers";
import {
    OrderData,
    SignatureType,
    Side as UtilsSide,
    Contracts,
    getContracts,
} from "@polymarket/order-utils";
import { Wallet } from "@ethersproject/wallet";
import { decimalPlaces, roundDown, roundNormal } from "../../src/utilities";

describe("helpers", () => {
    const chainId = Chain.MUMBAI;
    let wallet: Wallet;
    let contracts: Contracts;
    beforeEach(() => {
        // publicly known private key
        const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        wallet = new Wallet(privateKey);
        contracts = getContracts(chainId);
    });

    describe("buildOrder", () => {
        it("buy order", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.56,
                size: 21.04,
                side: Side.BUY,
                feeRateBps: 111,
                nonce: 123,
                expiration: 50000,
                taker: "0x0000000000000000000000000000000000000003",
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                SignatureType.EOA,
                order,
            );
            expect(orderData).not.null;
            expect(orderData).not.undefined;

            const signedOrder = await buildOrder(wallet, contracts.Exchange, chainId, orderData);
            expect(signedOrder).not.null;
            expect(signedOrder).not.undefined;

            expect(signedOrder.salt).not.empty;
            expect(signedOrder.maker).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.signer).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.taker).equal("0x0000000000000000000000000000000000000003");
            expect(signedOrder.tokenId).equal("123");
            expect(signedOrder.makerAmount).equal("11782400");
            expect(signedOrder.takerAmount).equal("21040000");
            expect(signedOrder.side).equal(UtilsSide.BUY);
            expect(signedOrder.expiration).equal("50000");
            expect(signedOrder.nonce).equal("123");
            expect(signedOrder.feeRateBps).equal("111");
            expect(signedOrder.signatureType).equal(SignatureType.EOA);
            expect(signedOrder.signature).not.empty;
        });

        it("buy order precision", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.82,
                size: 20.0,
                side: Side.BUY,
                feeRateBps: 0,
                nonce: 123,
                expiration: 50000,
                taker: "0x0000000000000000000000000000000000000003",
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                SignatureType.EOA,
                order,
            );
            expect(orderData).not.null;
            expect(orderData).not.undefined;

            const signedOrder = await buildOrder(wallet, contracts.Exchange, chainId, orderData);
            expect(signedOrder).not.null;
            expect(signedOrder).not.undefined;

            expect(signedOrder.salt).not.empty;
            expect(signedOrder.maker).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.signer).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.taker).equal("0x0000000000000000000000000000000000000003");
            expect(signedOrder.tokenId).equal("123");
            expect(signedOrder.makerAmount).equal("16400000");
            expect(signedOrder.takerAmount).equal("20000000");
            expect(signedOrder.side).equal(UtilsSide.BUY);
            expect(signedOrder.expiration).equal("50000");
            expect(signedOrder.nonce).equal("123");
            expect(signedOrder.feeRateBps).equal("0");
            expect(signedOrder.signatureType).equal(SignatureType.EOA);
            expect(signedOrder.signature).not.empty;
        });

        it("sell order", async () => {
            const order: UserOrder = {
                tokenID: "5",
                price: 0.56,
                size: 21.04,
                side: Side.SELL,
                feeRateBps: 0,
                nonce: 0,
                taker: "0x0000000000000000000000000000000000000003",
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                SignatureType.POLY_PROXY,
                order,
            );
            expect(orderData).not.null;
            expect(orderData).not.undefined;

            const signedOrder = await buildOrder(wallet, contracts.Exchange, chainId, orderData);
            expect(signedOrder).not.null;
            expect(signedOrder).not.undefined;

            expect(signedOrder.salt).not.empty;
            expect(signedOrder.maker).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.signer).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.taker).equal("0x0000000000000000000000000000000000000003");
            expect(signedOrder.tokenId).equal("5");
            expect(signedOrder.makerAmount).equal("21040000");
            expect(signedOrder.takerAmount).equal("11782400");
            expect(signedOrder.side).equal(UtilsSide.SELL);
            expect(signedOrder.expiration).equal("0");
            expect(signedOrder.nonce).equal("0");
            expect(signedOrder.feeRateBps).equal("0");
            expect(signedOrder.signatureType).equal(SignatureType.POLY_PROXY);
            expect(signedOrder.signature).not.empty;
        });
    });

    describe("getOrderAmounts", async () => {
        it("buy", async () => {
            const delta = 0.01;
            let size = 0.01;

            for (; size <= 100; ) {
                let price = 0.01;
                for (; price <= 1; ) {
                    const { rawMakerAmt, rawTakerAmt } = getOrderAmounts(Side.BUY, size, price);

                    expect(decimalPlaces(rawMakerAmt)).to.lte(4);
                    expect(decimalPlaces(rawTakerAmt)).to.lte(2);
                    expect(roundNormal(rawMakerAmt / rawTakerAmt, 6)).to.gte(roundNormal(price, 6));

                    price += delta;
                }
                size += delta;
            }
        });

        it("sell", async () => {
            const delta = 0.01;
            let size = 0.01;

            for (; size <= 100; ) {
                let price = 0.01;
                for (; price <= 1; ) {
                    const { rawMakerAmt, rawTakerAmt } = getOrderAmounts(Side.SELL, size, price);

                    expect(decimalPlaces(rawMakerAmt)).to.lte(2);
                    expect(decimalPlaces(rawTakerAmt)).to.lte(4);
                    expect(roundNormal(rawTakerAmt / rawMakerAmt, 6)).to.lte(roundNormal(price, 6));

                    price += delta;
                }
                size += delta;
            }
        });
    });

    describe("buildOrderCreationArgs", () => {
        it("buy order", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.56,
                size: 21.04,
                side: Side.BUY,
                feeRateBps: 111,
                nonce: 123,
                expiration: 50000,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "0x0000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000002",
                SignatureType.EOA,
                order,
            );
            expect(orderData).deep.equal({
                maker: "0x0000000000000000000000000000000000000002",
                taker: "0x0000000000000000000000000000000000000000",
                tokenId: "123",
                makerAmount: "11782400",
                takerAmount: "21040000",
                side: UtilsSide.BUY,
                feeRateBps: "111",
                nonce: "123",
                signer: "0x0000000000000000000000000000000000000001",
                expiration: "50000",
                signatureType: SignatureType.EOA,
            });
        });

        it("sell order", async () => {
            const order: UserOrder = {
                tokenID: "5",
                price: 0.56,
                size: 21.04,
                side: Side.SELL,
                feeRateBps: 0,
                nonce: 0,
                taker: "0x000000000000000000000000000000000000000A",
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "0x0000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000002",
                SignatureType.POLY_PROXY,
                order,
            );
            expect(orderData).deep.equal({
                maker: "0x0000000000000000000000000000000000000002",
                taker: "0x000000000000000000000000000000000000000A",
                tokenId: "5",
                takerAmount: "11782400",
                makerAmount: "21040000",
                side: UtilsSide.SELL,
                feeRateBps: "0",
                nonce: "0",
                signer: "0x0000000000000000000000000000000000000001",
                expiration: "0",
                signatureType: SignatureType.POLY_PROXY,
            });
        });

        it("correctly rounds price amounts for validity buy", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.56,
                size: 21.04,
                side: Side.BUY,
                feeRateBps: 100,
                nonce: 0,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.56);
        });

        it("correctly rounds price amounts for validity buy - 2", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.7,
                size: 170,
                side: Side.BUY,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("119000000");
            expect(orderData.takerAmount).to.equal("170000000");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.7);
        });

        it("correctly rounds price amounts for validity buy - 3", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.82,
                size: 101,
                side: Side.BUY,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("82820000");
            expect(orderData.takerAmount).to.equal("101000000");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.82);
        });

        it("correctly rounds price amounts for validity buy - 4", async () => {
            const order: UserOrder = {
                tokenID: "123",
                size: 12.8205,
                price: 0.78,
                side: Side.BUY,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("9999600");
            expect(orderData.takerAmount).to.equal("12820000");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.78);
        });

        it("correctly rounds price amounts for validity buy - 5", async () => {
            const order: UserOrder = {
                tokenID: "123",
                size: 2435.89,
                price: 0.39,
                side: Side.BUY,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("949997100");
            expect(orderData.takerAmount).to.equal("2435890000");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.39);
        });

        it("correctly rounds price amounts for validity sell", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.56,
                size: 21.04,
                side: Side.SELL,
                feeRateBps: 100,
                nonce: 0,
            };

            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(Number(orderData.takerAmount) / Number(orderData.makerAmount)).to.equal(0.56);
        });

        it("correctly rounds price amounts for validity sell - 2", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.7,
                size: 170,
                side: Side.SELL,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.takerAmount).to.equal("119000000");
            expect(orderData.makerAmount).to.equal("170000000");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.7);
        });

        it("correctly rounds price amounts for validity sell - 3", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.82,
                size: 101,
                side: Side.SELL,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("101000000");
            expect(orderData.takerAmount).to.equal("82820000");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.82);
        });

        it("correctly rounds price amounts for validity sell - 4", async () => {
            const order: UserOrder = {
                tokenID: "123",
                size: 12.8205,
                price: 0.78,
                side: Side.SELL,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("12820000");
            expect(orderData.takerAmount).to.equal("9999600");
            expect(Number(orderData.takerAmount) / Number(orderData.makerAmount)).to.gte(0.78);
        });

        it("correctly rounds price amounts for validity sell - 5", async () => {
            const order: UserOrder = {
                tokenID: "123",
                size: 2435.89,
                price: 0.39,
                side: Side.SELL,
            };
            const orderData: OrderData = await buildOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("2435890000");
            expect(orderData.takerAmount).to.equal("949997100");
            expect(Number(orderData.takerAmount) / Number(orderData.makerAmount)).to.gte(0.39);
        });
    });

    describe("createOrder", () => {
        it("buy order", async () => {
            const order: UserOrder = {
                tokenID: "123",
                price: 0.56,
                size: 21.04,
                side: Side.BUY,
                feeRateBps: 111,
                nonce: 123,
                expiration: 50000,
            };

            const signedOrder = await createOrder(
                wallet,
                Chain.MUMBAI,
                SignatureType.EOA,
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                order,
            );
            expect(signedOrder).not.null;
            expect(signedOrder).not.undefined;

            expect(signedOrder.salt).not.empty;
            expect(signedOrder.maker).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.signer).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.taker).equal("0x0000000000000000000000000000000000000000");
            expect(signedOrder.tokenId).equal("123");
            expect(signedOrder.makerAmount).equal("11782400");
            expect(signedOrder.takerAmount).equal("21040000");
            expect(signedOrder.side).equal(UtilsSide.BUY);
            expect(signedOrder.expiration).equal("50000");
            expect(signedOrder.nonce).equal("123");
            expect(signedOrder.feeRateBps).equal("111");
            expect(signedOrder.signatureType).equal(SignatureType.EOA);
            expect(signedOrder.signature).not.empty;
        });

        it("sell order", async () => {
            const order: UserOrder = {
                tokenID: "5",
                price: 0.56,
                size: 21.04,
                side: Side.SELL,
                feeRateBps: 0,
                nonce: 0,
            };

            const signedOrder = await createOrder(
                wallet,
                Chain.MUMBAI,
                SignatureType.POLY_GNOSIS_SAFE,
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                order,
            );

            expect(signedOrder.salt).not.empty;
            expect(signedOrder.maker).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.signer).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.taker).equal("0x0000000000000000000000000000000000000000");
            expect(signedOrder.tokenId).equal("5");
            expect(signedOrder.makerAmount).equal("21040000");
            expect(signedOrder.takerAmount).equal("11782400");
            expect(signedOrder.side).equal(UtilsSide.SELL);
            expect(signedOrder.expiration).equal("0");
            expect(signedOrder.nonce).equal("0");
            expect(signedOrder.feeRateBps).equal("0");
            expect(signedOrder.signatureType).equal(SignatureType.POLY_GNOSIS_SAFE);
            expect(signedOrder.signature).not.empty;
        });
    });

    describe("getMarketBuyOrderRawAmounts", async () => {
        it("market buy", async () => {
            const delta = 0.01;
            let size = 0.01;

            for (; size <= 100; ) {
                let price = 0.01;
                for (; price <= 1; ) {
                    price = roundNormal(price, 8);
                    const { rawMakerAmt, rawTakerAmt } = getMarketBuyOrderRawAmounts(size, price);

                    expect(decimalPlaces(rawMakerAmt)).to.lte(2);
                    expect(decimalPlaces(rawTakerAmt)).to.lte(4);
                    expect(roundNormal(rawMakerAmt / rawTakerAmt, 4)).to.gte(roundNormal(price, 4));

                    price += delta;
                }
                size += delta;
            }
        });
    });

    describe("buildMarketBuyOrderCreationArgs", () => {
        it("market buy order", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.56,
                amount: 100,
                feeRateBps: 111,
                nonce: 123,
                expiration: 50000,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "0x0000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000002",
                SignatureType.EOA,
                order,
            );
            expect(orderData).deep.equal({
                maker: "0x0000000000000000000000000000000000000002",
                taker: "0x0000000000000000000000000000000000000000",
                tokenId: "123",
                makerAmount: "100000000",
                takerAmount: "178571400",
                side: UtilsSide.BUY,
                feeRateBps: "111",
                nonce: "123",
                signer: "0x0000000000000000000000000000000000000001",
                expiration: "50000",
                signatureType: SignatureType.EOA,
            });
        });

        it("market buy order with a different price", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.5,
                amount: 100,
                feeRateBps: 111,
                nonce: 123,
                expiration: 50000,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "0x0000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000002",
                SignatureType.EOA,
                order,
            );
            expect(orderData).deep.equal({
                maker: "0x0000000000000000000000000000000000000002",
                taker: "0x0000000000000000000000000000000000000000",
                tokenId: "123",
                makerAmount: "100000000",
                takerAmount: "200000000",
                side: UtilsSide.BUY,
                feeRateBps: "111",
                nonce: "123",
                signer: "0x0000000000000000000000000000000000000001",
                expiration: "50000",
                signatureType: SignatureType.EOA,
            });
        });

        it("correctly rounds price amounts for validity buy", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.56,
                amount: 21.04,
                feeRateBps: 100,
                nonce: 0,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );

            const price = roundDown(
                Number(orderData.makerAmount) / Number(orderData.takerAmount),
                2,
            );
            expect(price).to.equal(0.56);
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.greaterThan(
                0.56,
            );
        });

        it("correctly rounds price amounts for validity buy - 2", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.7,
                amount: 119,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );

            expect(orderData.makerAmount).to.equal("119000000");
            expect(orderData.takerAmount).to.equal("170000000");

            const price = roundDown(
                Number(orderData.makerAmount) / Number(orderData.takerAmount),
                2,
            );
            expect(price).to.equal(0.7);
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.7);
        });

        it("correctly rounds price amounts for validity buy - 3", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.82,
                amount: 82.82,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("82820000");
            expect(orderData.takerAmount).to.equal("101000000");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.82);
        });

        it("correctly rounds price amounts for validity buy - 4", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.78,
                amount: 9.9996,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("9990000");
            expect(orderData.takerAmount).to.equal("12807600");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.78);
        });

        it("correctly rounds price amounts for validity buy - 5", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.39,
                amount: 949.9971,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("949990000");
            expect(orderData.takerAmount).to.equal("2435871700");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.39);
        });

        it("correctly rounds price amounts for validity buy - 6", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.56,
                amount: 1,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("1000000");
            expect(orderData.takerAmount).to.equal("1785700");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.39);
        });

        it("correctly rounds price amounts for validity buy - 7", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.57,
                amount: 1,
            };
            const orderData: OrderData = await buildMarketBuyOrderCreationArgs(
                "",
                "",
                SignatureType.EOA,
                order,
            );
            expect(orderData.makerAmount).to.equal("1000000");
            expect(orderData.takerAmount).to.equal("1754300");
            expect(Number(orderData.makerAmount) / Number(orderData.takerAmount)).to.gte(0.39);
        });
    });

    describe("createMarketBuyOrder", () => {
        it("buy order", async () => {
            const order: UserMarketOrder = {
                tokenID: "123",
                price: 0.56,
                amount: 100,
                feeRateBps: 111,
                nonce: 123,
                expiration: 50000,
            };

            const signedOrder = await createMarketBuyOrder(
                wallet,
                Chain.MUMBAI,
                SignatureType.EOA,
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                order,
            );
            expect(signedOrder).not.null;
            expect(signedOrder).not.undefined;

            expect(signedOrder.salt).not.empty;
            expect(signedOrder.maker).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.signer).equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
            expect(signedOrder.taker).equal("0x0000000000000000000000000000000000000000");
            expect(signedOrder.tokenId).equal("123");
            expect(signedOrder.makerAmount).equal("100000000");
            expect(signedOrder.takerAmount).equal("178571400");
            expect(signedOrder.side).equal(UtilsSide.BUY);
            expect(signedOrder.expiration).equal("50000");
            expect(signedOrder.nonce).equal("123");
            expect(signedOrder.feeRateBps).equal("111");
            expect(signedOrder.signatureType).equal(SignatureType.EOA);
            expect(signedOrder.signature).not.empty;
        });
    });
});
