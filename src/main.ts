import EventEmitter from "events";
import net from "net";
import { stdin, stdout } from "process";
import { createInterface } from "readline";

interface PeerInfos {
    host: string
}

type Callback = (data: string) => void;

type P2PEvents = "data";


/**
 * 
 */
class Peer {


    private readonly PORT = 9090;

    private eventEmitter = new EventEmitter();

    private peerSocket: net.Socket | null = null;


    public get isConnected() : boolean{
        return this.peerSocket != null;
    }

    /**
     * Listen to incomming peer connection
     */
    constructor() {
        net.createServer((socketClient) => {
            this.peerSocket = socketClient;
            this.initPeerSocket();

        }).listen(this.PORT);
    }

    private initPeerSocket(){
        if(this.peerSocket == null){
            throw Error("peer socket should be connected before initalisation");
        }
        
        this.peerSocket.on("close",()=>{
            this.peerSocket = null;
        }).on("data",(data)=>{
            this.eventEmitter.emit("data",data.toString());
        });
    }

    connectToPeer(peerInfos: PeerInfos): Promise<void> {
        return new Promise((resolve, reject) => {
            if(this.isConnected)reject("Peer already connected !");

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
            }).on("close",()=>{
                this.peerSocket = null;
            });
        });
    }

    send(msg: string): void {
        this.peerSocket?.write(msg);
    }

    on(eventName: P2PEvents, callback: Callback) {
        this.eventEmitter.on(eventName, callback);
    }

    close(){
        if(this.peerSocket !=null){
            this.peerSocket.end();
            this.peerSocket = null;
            console.log("Peer disconnected");
        }else{
            console.warn("Socket not connected.");
        }
    }
}


async function main(){
    const logger = createInterface({input:stdin,output:stdout});


    // Je crée le peer
    const peer = new Peer();

    // Si l'autre peer lui envoi des donnée
    peer.on("data", (data) => {
        console.log("data recv from peer : ",data);
    });

    
    logger.on("line",async (input)=>{
        switch (input) {
            case "connect":
                // Je commence à parler en premier !
                await peer.connectToPeer({
                    host: "127.0.0.1"
                }).catch(console.warn);
                console.log("peer.isConnected",peer.isConnected);
                break;

            case "exit":
                peer.close();
                break;
        
            default:
                if(peer.isConnected){
                    console.log("Sending data to other peer...");
                    peer.send(input);
                }else{
                    console.log("Not connected cannot send message");
                }
                break;
        }
    })


}
main();