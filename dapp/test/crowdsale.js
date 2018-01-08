"use strict";

let Treasurer = artifacts.require('Treasurer');
let Crowdsale = artifacts.require('Crowdsale');
let GetToken = artifacts.require('GetToken');

let TestBosonResolver = artifacts.require('TestBosonAddressResolver');
let TestBoson = artifacts.require('TestBoson');

class TestBosonRunner {
    constructor() {
        this.trusted = new Set();
        this.waiters = [];
    }

    nextQuery() {
        let promise = new Promise((resolve, reject) => {
            this.waiters.push(resolve);
        });
        return promise;
    }

    async processQuery(contract, address, id) {
        let result = this.trusted.has(address);
        await this.boson.proxyResponse.sendTransaction(contract, id, result);
        return result;
    }

    async start() {
        this.boson = await TestBoson.new();
        this.resolver = await TestBosonResolver.new(this.boson.address);

        this.query = this.boson.Query();
        this.query.watch((error, result) => {
            if (error) {
                return;
            }
            let address = result.args._address;
            let contract = result.args._contract;
            let id = result.args._id;

            // Process query and call contract back.
            this.processQuery(contract, address, id).then((result) => {
                // Wake waiters from test code.
                let waiters = this.waiters.slice();
                this.waiters = [];
                for (let waiter of waiters) {
                    waiter({contract, address, id, result});
                }
            });
        });
    }

    stop() {
        this.query.stopWatching();
    }
}



contract('Treasurer', (accounts) => {
    let deployer = accounts[0];
    let team = accounts[1];
    let boson = new TestBosonRunner();

    let treasurer;
    let token;
    let crowdsale;

    it("should be deployed successfully", async () => {
        await boson.start();
        treasurer = await Treasurer.new(team);
    });

    it("should have the expected state after construction", async () => {
        assert.equal((await treasurer.state.call()).valueOf(), 0, "state wasn't Initialized");
        assert.equal(await treasurer.team.call(), team, "team wasn't set correctly");
    });

    it("should start and create the token and crowdsale contracts", async () => {
        await treasurer.start(boson.resolver.address);
        token = GetToken.at(await treasurer.token.call());
        crowdsale = Crowdsale.at(await treasurer.crowdsale.call());
    });

    it("should have sent the team half of the supply of the token", async () => {
        let totalSupply = await token.totalSupply.call();
        let teamBalance = await token.balanceOf.call(team);
        assert.isAbove(totalSupply.valueOf(), 0, "total supply of the token wasn't set correctly");
        assert.equal(teamBalance.valueOf(), totalSupply.valueOf() / 2, "team account balance wasn't set correctly");
    });

    it("should have sent the crowdsale contract half of the token", async () => {
        let totalSupply = await token.totalSupply.call();
        let crowdsaleBalance = await token.balanceOf.call(crowdsale.address);
        assert.equal(crowdsaleBalance.valueOf(), totalSupply.valueOf() / 2, "crowdsale account balance wasn't set correctly");
    });

    it("should have started the crowdsale", async () => {
        assert.equal((await crowdsale.state.call()).valueOf(), 1, "crowdsale is not started");
    });

    after(() => {
        boson.stop();
    });
});

contract('Crowdsale', (accounts) => {
    let token;
    let crowdsale;
    let boson = new TestBosonRunner();
    let initialSupply = 100 * 1000;
    let ether = 1000000000000000000;

    it("should be deployed correctly", async () => {
        await boson.start();
        token = await GetToken.new(accounts[0], initialSupply);
        crowdsale = await Crowdsale.new(token.address, boson.resolver.address);
        assert.equal((await crowdsale.state.call()).valueOf(), 0, "crowdsale state hasn't been set");
        assert.equal(await crowdsale.token.call(), token.address, "crowdsale token hasn't been set");
        assert.equal(await crowdsale.owner.call(), accounts[0], "crowdsale owner hasn't been set");
    });

    it("should start correctly", async() => {
        await token.transfer.sendTransaction(crowdsale.address, initialSupply);
        await crowdsale.start.sendTransaction();
        assert.equal((await crowdsale.state.call()).valueOf(), 1, "crowdsale state hasn't changed to started");
        assert.equal((await crowdsale.tokensLeft.call()).valueOf(), initialSupply, "crowdsale initialSupply hasn't been set");
        assert.equal((await token.balanceOf(crowdsale.address)).valueOf(), initialSupply, "crowdsale doesn't hold funds");
    });

    it("should have working approvals", async () => {
        let buyer = accounts[2];

        assert.equal(await crowdsale.approved.call(buyer), false, "buyer got wrongly approved");
        await crowdsale.approve.sendTransaction(buyer);
        await boson.nextQuery();
        assert.equal(await crowdsale.approved.call(buyer), false, "buyer got wrongly approved");
        assert.equal(await crowdsale.rejected.call(buyer), true, "buyer didn't get rejected");

        boson.trusted.add(buyer);
        await crowdsale.approve.sendTransaction(buyer);
        await boson.nextQuery();
        assert.equal(await crowdsale.approved.call(buyer), true, "buyer didn't get approved");
        assert.equal(await crowdsale.rejected.call(buyer), false, "buyer got wrongly rejected");
    });

    it("should let us buy some tokens", async() => {
        let buyer = accounts[2];
        let price = await crowdsale.price.call();
        let wei = 1 * ether;
        let tokens = wei / price.toNumber();

        assert.equal((await token.balanceOf.call(buyer)).valueOf(), 0, "buyer owns some tokens already");
        await crowdsale.buy.sendTransaction(buyer, {value: 1 * ether});
        assert.equal((await token.balanceOf.call(buyer)).valueOf(), tokens, "buyer didn't receive expected amount of tokens");
    });

    after(() => {
        boson.stop();
    });
});
