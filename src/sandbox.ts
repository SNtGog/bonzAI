import {Operation} from "./ai/operations/Operation";
import {Mission} from "./ai/missions/Mission";
import {Agent} from "./ai/missions/Agent";
import {RoomHelper} from "./ai/RoomHelper";
import {notifier} from "./notifier";
import {empire} from "./ai/Empire";

export var sandBox = {
    run: function() {
        let claimerFlag = Game.flags["claimerFlag"];
        if (claimerFlag) {
            let claimer = Game.creeps["claimer"];
            if (!claimer) {
                empire.spawnFromClosest(claimer.pos, [CLAIM, MOVE], "claimer");
            }
            if (claimer.pos.inRangeTo(claimerFlag, 0)) {
                claimer.claimController(claimer.room.controller);
                console.log("### claimer waiting");
            } else {
                empire.traveler.travelTo(claimer, claimerFlag);
            }
        }

        let sandboxFlag = Game.flags["sandbox"];
        if (sandboxFlag) {
            let sandboxOp = new SandboxOperation(sandboxFlag, "sand0", "sandbox");
            global.sand0 = sandboxOp;
            sandboxOp.init();
            sandboxOp.roleCall();
            sandboxOp.actions();
            sandboxOp.finalize();
        }

        if (!Memory.temp.ranTest) {
            Memory.temp.ranTest = true;
            let place1 = Game.flags["keeper_lima6"];
            let destinations = _.toArray(empire.spawnGroups);
            let selected = RoomHelper.findClosest(place1, destinations, {margin: 50});
            console.log(`selected the following: `);
            for (let value of selected) { console.log(value.destination.pos); }
        }

        if (Game.time % 10 === 0) {
            console.log("cpu: " + _.round(Memory.cpu.average, 2), "perCreep: " +
                _.round(Memory.cpu.average / Object.keys(Game.creeps).length, 2));
        }

        if (Memory.temp.test) {
            // testSerialPos();
            testFunction();
            Memory.temp.test = undefined;
        }
    },
};

function testFunction() {
    let cpu = Game.cpu.getUsed();

    console.log(`operator: ${Game.cpu.getUsed() - cpu}`);

    cpu = Game.cpu.getUsed();

    console.log(`function: ${Game.cpu.getUsed() - cpu}`);
}

function testSerialPos() {
    let room = Game.spawns["Spawn1"].room;
    let positions = room.find<Structure>(FIND_STRUCTURES).map(s => s.pos);
    let jsons = positions.map(p => { return {x: p.x, y: p.y, roomName: p.roomName}; });
    let integers = positions.map(p => room.serializePosition(p));
    let unicodes = positions.map(p => room.serializePositionTest(p));

    console.log("\nthese compare what the overhead per tick would be for just storage");
    let cpu = Game.cpu.getUsed();
    for (let i = 0; i < 100; i++) {
        let str = JSON.stringify(jsons);
        JSON.parse(str);
    }
    console.log(`nonserialized: ${Game.cpu.getUsed() - cpu}`);
    cpu = Game.cpu.getUsed();
    for (let i = 0; i < 100; i++) {
        let str = JSON.stringify(integers);
        JSON.parse(str);
    }
    console.log(`type 1: ${Game.cpu.getUsed() - cpu}`);
    cpu = Game.cpu.getUsed();
    for (let i = 0; i < 100; i++) {
        let str = JSON.stringify(unicodes);
        JSON.parse(str);
    }
    console.log(`type 2: ${Game.cpu.getUsed() - cpu}`);

    console.log("\nthese compare the cost for deserialization");
    cpu = Game.cpu.getUsed();
    for (let json of jsons) {
        let position = new RoomPosition(json.x, json.y, json.roomName);
    }
    console.log(`json: ${Game.cpu.getUsed() - cpu}`);
    cpu = Game.cpu.getUsed();
    for (let json of jsons) {
        let position = _.create(json);
    }
    console.log(`json (lodash): ${Game.cpu.getUsed() - cpu}`);
    cpu = Game.cpu.getUsed();
    for (let integer of integers) {
        let position = room.deserializePosition(integer);
    }
    console.log(`integer: ${Game.cpu.getUsed() - cpu}`);
    cpu = Game.cpu.getUsed();
    for (let unicode of unicodes) {
        let position = room.deserializePositionTest(unicode);
    }
    console.log(`unicode: ${Game.cpu.getUsed() - cpu}`);
}

class SandboxOperation extends Operation {
    public initOperation() {
        this.addMission(new SandboxMission(this, "sandbox"));
    }

    public finalizeOperation() {
    }

    public invalidateOperationCache() {
    }

}

class SandboxMission extends Mission {
    public initMission() {
    }

    public roleCall() {
    }

    public missionActions() {
        // this.squadTravelTest();
        // this.fleeByPathTest();
        this.fatigueTest();
    }

    public finalizeMission() {
    }

    public invalidateMissionCache() {
    }

    public squadTravelTest() {
        let leaderCreep = Game.creeps["leader"];
        let leader;
        if (leaderCreep) {
            leader = new Agent(leaderCreep, this);
        } else {
            empire.spawnFromClosest(this.flag.pos, [MOVE], "leader");
        }

        let followerCreep = Game.creeps["follower"];
        let follower;
        if (followerCreep) {
            follower = new Agent(followerCreep, this);
        } else {
            empire.spawnFromClosest(this.flag.pos, [MOVE], "follower");
        }

        if (!leader || !follower) { return; }

        Agent.squadTravel(leader, follower, this.flag);
    }

    private fleeByPathTest() {
        let fleeFlag = Game.flags["fleeFlag"];
        if (!fleeFlag) { return; }

        let fleeCreep = Game.creeps["fleeCreep"];
        if (!fleeCreep) {
            empire.spawnFromClosest(fleeFlag.pos, [MOVE], "fleeCreep");
            return;
        }

        let agent = new Agent(fleeCreep, this);
        fleeFlag["id"] = "scaryGuy";
        let fleeing = agent.fleeByPath([fleeFlag as any], 6, 3);
        if (!fleeing) {
            agent.travelTo(fleeFlag);
        }
    }

    private fatigueTest() {
        let fattyCreep = Game.creeps["fatty"];
        if (!fattyCreep) {
            empire.spawnFromClosest(this.flag.pos, [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE],
                "fatty");
            return;
        }
        let fatty = new Agent(fattyCreep, this);
        fatty.travelTo(this.flag);
    }
}
