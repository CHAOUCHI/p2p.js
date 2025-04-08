var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import EventEmitter from "events";
import net from "net";
import { stdin, stdout } from "process";
import { createInterface } from "readline";
/**
 *
 */
class Peer {
    get isConnected() {
        return this.peerSocket != null;
    }
    /**
     * Listen to incomming peer connection
     */
    constructor() {
        this.PORT = 9090;
        this.eventEmitter = new EventEmitter();
        this.peerSocket = null;
        net.createServer((socketClient) => {
            this.peerSocket = socketClient;
            this.initPeerSocket();
        }).listen(this.PORT);
    }
    initPeerSocket() {
        if (this.peerSocket == null) {
            throw Error("peer socket should be connected before initalisation");
        }
        this.peerSocket.on("close", () => {
            this.peerSocket = null;
        }).on("data", (data) => {
            this.eventEmitter.emit("data", data.toString());
        });
    }
    connectToPeer(peerInfos) {
        return new Promise((resolve, reject) => {
            if (this.isConnected)
                reject("Peer already connected !");
            const clientSocket = net.createConnection({
                host: peerInfos.host,
                port: this.PORT
            })
                .on("ready", () => {
                this.peerSocket = clientSocket;
                this.initPeerSocket();
                resolve();
            })
                .on("error", (error) => {
                reject(error);
            }).on("close", () => {
                this.peerSocket = null;
            });
        });
    }
    send(msg) {
        var _a;
        (_a = this.peerSocket) === null || _a === void 0 ? void 0 : _a.write(msg);
    }
    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }
    close() {
        if (this.peerSocket != null) {
            this.peerSocket.end();
            this.peerSocket = null;
            console.log("Peer disconnected");
        }
        else {
            console.warn("Socket not connected.");
        }
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = createInterface({ input: stdin, output: stdout });
        // Je crée le peer
        const peer = new Peer();
        // Si l'autre peer lui envoi des donnée
        peer.on("data", (data) => {
            console.log("data recv from peer : ", data);
        });
        const help = `
connect : connect to the other peer, after that just type yout message to talk to the other peer
exit : close connection to other peer
    `;
        console.log("Type help for cli command");
        logger.on("line", (input) => __awaiter(this, void 0, void 0, function* () {
            switch (input) {
                case "connect":
                    // Je commence à parler en premier !
                    yield peer.connectToPeer({
                        host: "127.0.0.1"
                    }).catch(console.warn);
                    console.log("peer.isConnected", peer.isConnected);
                    break;
                case "help":
                    console.log(help);
                    break;
                case "exit":
                    peer.close();
                    break;
                default:
                    if (peer.isConnected) {
                        console.log("Sending data to other peer...");
                        peer.send(input);
                    }
                    else {
                        console.log("Not connected cannot send message");
                    }
                    break;
            }
        }));
    });
}
main();
